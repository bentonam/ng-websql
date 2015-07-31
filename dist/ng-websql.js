angular
.module( "ngWebSql", [] )
.factory( "$db", [ "$window", "$q", function( $window, $q ) {
	var self = this;
	self.db = null;
	self.config = null;
	self.initialized = false;
	/**
	* Initialization method, handles creation of the database
	* @config The database config
	*/
	self.init = function( config ) {
		var statements = [],
			deferred = $q.defer();
		self.config = config;
		self.config.logging = !self.config.hasOwnProperty("logging") ? false : self.config.logging;
		self.config.logging && console.log("Initializing Database: " + config.name);
		self.db = $window.sqlitePlugin ? $window.sqlitePlugin.openDatabase( { name: config.name } ) : $window.openDatabase( config.name, "1.0", "database", -1 );
		try{
			// loop over each table and build our create table statement
			angular.forEach( self.config.tables, function( table ) {
				var definitions = [];
				// build each of the columns
				angular.forEach( table.columns, function( column ) {
					definitions.push(
						column.name + " " + column.type +
						( !column.is_null ? " NOT" : "" ) + " NULL" +
						( column.hasOwnProperty( "default" ) ? " DEFAULT (" + column.default + ")" : "" )
					);
				} );
				// set the primary key if it exists
				if( table.primary_key ) {
					definitions.push( "PRIMARY KEY (" + table.primary_key.join(",") + ")")
				}
				// set any foreign_keys
				if( table.foreign_keys ) {
					angular.forEach( table.foreign_keys, function( foreign_key ) {
						definitions.push( "CONSTRAINT '" + foreign_key.name + "' FOREIGN KEY ('" + foreign_key.foreign_key + "') REFERENCES '" + foreign_key.references + "' ('" + foreign_key.primary_key + "')" );
					} );
				}
				// set any uniques
				if( table.uniques ) {
					angular.forEach( table.uniques, function( unique ) {
						definitions.push( "UNIQUE(" + unique.fields.join( "," ) + ")" );
					} );
				}
				var query = "CREATE TABLE IF NOT EXISTS " + table.name + " ( " + definitions.join( "," ) + " )";
				if( table.without_rowid ) {
					query += " WITHOUT ROWID";
				}
				statements.push(
					self.query( query )
						.then(
							function() {
								self.config.logging && console.log( "Initialized Table: " + table.name );
							},
							function( error ) {
								self.config.logging && console.log( error );
							}
						)
				);
				// create any indexes on the table
				angular.forEach( table.indexes, function( index ) {
					statements.push(
						self
							.query( "CREATE " + ( index.unique ? "UNIQUE " : "" ) + "INDEX IF NOT EXISTS " + index.name + " ON " + table.name + " ( " + index.columns.join( "," ) + " )" )
							.then(
								function() {
									self.config.logging && console.log( "Created Index: " + index.name );
								},
								function( error ) {
									self.config.logging && console.log( error );
								}
							)
					);
				} );
			} );
			// loop over each view and build our create view statement
			angular.forEach( self.config.views, function( view ) {
				statements.push(
					self
						.query( "CREATE " + ( view.temp ? "TEMP " : "" ) + "VIEW IF NOT EXISTS " + view.name + " AS " + view.statement )
						.then(
								function() {
									self.config.logging && console.log( "Created View: " + view.name );
								},
								function( error ) {
									self.config.logging && console.log( error );
								}
							)
				);
			} );
			$q
				.all( statements )
				.then( function() {
					self.initialized = true;
					self.config.logging && console.log( "Database Initialized" );
					deferred.resolve();
				});
		}
		catch( e ) {
			deferred.reject( e );
		}
		return deferred.promise;
	};
	/**
	* Execute a query and return a an array of objects or just an object
	* @statement The SQL statement to be executed
	* @bindings Any query bindings
	* @single Whether or not to return a single record as an object
	*/
	self.query = function( statement, bindings ) {
		var deferred = $q.defer();
		// make sure bindings is set
		bindings = typeof bindings !== "undefined" ? bindings : [];
		self.db.transaction( function( transaction ) {
			transaction.executeSql(
				statement,
				bindings,
				function( transaction, result ) {
					deferred.resolve( result );
				},
				function( transaction, error ) {
					deferred.reject( error );
				}
			);
		} );
		return deferred.promise;
	};
	/**
	* Drops database objects i.e. tables, views, indexes
	* @object_name The name of the object to drop
	* @type The type of object to drop i.e. TABLE, INDEX, VIEW
	*/
	self.drop = function( object_name, type ) {
		var deferred = $q.defer();
		if( "TABLE,INDEX,VIEW".indexOf( type.toUpperCase() ) === -1 ){
			deferred.reject( "Invalid object type" );
		}
		else{
			self
				.query( "DROP " + type + " " + object_name )
				.then( function() {
					deferred.resolve();
				} );
		}
		return deferred.promise;
	};
	/**
	* Drops and recreates and index on a table
	* @name Name of the index
	* @table Table to create the index on
	* @columns The columns to create the index for
	* @unique Whether or not it is a unique index
	*/
	self.index = function( name, table, columns, unique ) {
		var deferred = $q.defer();
		$q.all(
			[
				self.query( "DROP INDEX " + name ),
				self.query( "CREATE " + ( unique ? "UNIQUE " : "" ) + "INDEX " + name + " ON " + table + " ( " + columns.join( "," ) + " )" )
			]
		)
		.then( function( ) {
			deferred.resolve();
		} );
		return deferred.promise;
	};
	/**
	* Drops and recreates and view on a table
	* @name Name of the index
	* @table Table to create the index on
	* @columns The columns to create the index for
	* @unique Whether or not it is a unique index
	*/
	self.view = function( name, statement, temp ) {
		var deferred = $q.defer();
		$q.all(
			[
				self.query( "DROP VIEW " + name ),
				self.query( "CREATE " + ( temp ? "TEMP " : "" ) + "VIEW " + name + " AS " + statement )
			]
		)
		.then( function( ) {
			deferred.resolve();
		} );
		return deferred.promise;
	};
	/**
	* Recreates the database by dropping an recreating all tables base on the config
	*/
	self.recreate = function() {
		var statements = [],
			deferred = $q.defer();
		self.config.logging && console.log("Recreating Database: " + self.config.name);
		angular.forEach( self.config.tables, function( table ) {
			statements.push( self.query( "DROP TABLE " + table.name ) );
		} );
		$q
			.all( statements )
			.then( function() {
				self
					.init( self.config )
					.then(
						function() {
							self.config.logging && console.log("Successfully Recreated Database: " + self.config.name);
							deferred.resolve();
						},
						function( reason ){
							self.config.logging && console.log("Failed to Recreate Database: " + self.config.name);
							deferred.reject( reason );
						}
					);
			} )
		return deferred.promise;
	};
	/**
	* Gets all of the columns for a table based on its create statement
	* @table
	*/
	self.columns = function( table ) {
		return self
				.query( "SELECT * FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1", [ table ], true )
				.then( function( result ) {
					return self.row( result );
				} )
				.then( function( result ) {
					var fields = result.sql
									.replace( /^[^(]+\(\s*/, "" ) // strip from the start to the first (
									.replace( /,?primary\skey.*$/i, "" ) // strip from primary key to the end of the string
									.replace( /(\(|\)).*$/, "" ) // strip from ( or ) to the end of the string
									.replace( /\s[^,]+/g, "" ); // strip from every space to a comma
					return fields.split( "," );
				} );
	};
	/**
	* Gets the entire resultset as an array of objects
	* @result The result of a query
	*/
	self.resultset = function( result ) {
		var data = [];
		for ( var i = 0; i < result.rows.length; i++ ) {
			data.push( result.rows.item( i ) );
		}
		return data;
	};
	/**
	* Gets a single row from the resultset as an object
	* @result The result of a query
	* @index (optional) The row index to retrieve, default 0
	*/
	self.row = function( result, index ) {
		index = index || 0;
		return result.rows.length  && result.rows[ index ] ? result.rows.item( index ) : {};
	};
	return self;
} ] );