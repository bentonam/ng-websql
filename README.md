# ng-websql

This is a wrapper for WebSQL for Angular JS.  Each of the implemented methods use promises.

## Installing

Install via bower

`bower install https://github.com/bentonam/ng-websql.git`

Require it into your application (after Angular)

	<script src="angular.min.js"></script>
	<script src="ng-websql.js"></script>
	
## Usage

Add the module as a dependency to your app

	// set the app
	var app = angular.module( "yourApp", [ "ngWebSql" ] );

Create a database config and schema
	
	app.constant( "DB_CONFIG", {
		name: "YourDB",
		logging: true,
		tables: [
			{
				name: "Titles",
				columns: [
					{ name: "title_id", type: "INTEGER" },
					{ name: "title", type: "TEXT" }
				],
				primary_key: [ "title_id" ],
				uniques: [
					{
						fields: [ "title" ]
					}
				]
			},
			{
				name: "Departments",
				columns: [
					{ name: "department_id", type: "INTEGER", is_null: false },
					{ name: "department", type: "TEXT", is_null: false }
				],
				primary_key: [ "department_id" ],
				uniques: [
					{
						fields: [ "department" ]
					}
				]
			},
			{
				name: "Employees",
				columns: [
					{ name: "employee_id", type: "INTEGER" },
					{ name: "first_name", type: "TEXT" },
					{ name: "last_name", type: "TEXT" },
					{ name: "email", type: "TEXT" },
					{ name: "gender", type: "TEXT", is_null: true },
					{ name: "birth_date", type: "DATE", is_null: true },
					{ name: "title_id", type: "INTEGER" },
					{ name: "department_id", type: "INTEGER" },
					{ name: "last_modified", type: "DATE", default: "datetime( 'now', 'localtime' )" }
				],
				primary_key: [ "employee_id" ],
				foreign_keys: [
					{
						name: "fk_Employees_title_id",
						foreign_key: "title_id",
						references: "Titles",
						primary_key: "title_id"
					},
					{
						name: "fk_Employees_department_id",
						foreign_key: "department_id",
						references: "Departments",
						primary_key: "department_id"
					}
				],
				uniques: [
					{
						fields: [ "email" ]
					}
				],
				indexes: [
					{
						unique: false,
						name: "idx_Employees_email",
						columns: [
							"email ASC"
						]
					}
				]
			}
		],
		views: [
			{
				name: "vwITEmployees",
				statement: "SELECT e.* FROM Employees AS e INNER JOIN Departments AS d ON d.department_id = e.department_id WHERE d.department = 'IT'"
			},
			{
				name: "vwCreativeEmployees",
				statement: "SELECT e.* FROM Employees AS e INNER JOIN Departments AS d ON d.department_id = e.department_id WHERE d.department = 'Creative'"
			}
		]
	} );
	
Initialize the database on run, this will create a connection to the database, and create the tables if they do not already exist.

	app.run( function( $db, DB_CONFIG ){
		// initialize the database
		$db
			.init( DB_CONFIG )
			.then( function() {
				console.log( "database ready" );
			} )
		return;
	});
	
	
Inject it into your controller

	app.controller( "SomeController"", function( $scope, $db ) {
		$db
			.query( "SELECT * FROM Employees" )
			.then( function( result ) {
			
			} );
	} );

## Methods

###init()

The `init` method should be called in your `app.run()` block to initialize the database.  It takes a single object as an argument.  

- `@config` The config for the database

The object can contain 4 properties: 

1. `name` The name of the database
2. `logging` Whether or not to enable console logging
3. `tables` An array of tables to create if they do not already exist
4. `views` An array of views to create if any

###query()

Executes a query and returns a promise which will return the SQLResultSet object from the query

- `@statement` The SQL statement to be executed
- `@bindings` An array of data bindings / query parameters

**Usage**

	var employee_id = 1;
	$db
		.query(
			"SELECT * FROM Employees WHERE employee_id = ? LIMIT 1",
			[ employee_id ]
		);

###resultset()

Gets the entire resultset as an array of objects

- `@result` The SQLResultSet object from a query

**Usage:**

	var department = "IT";
	$scope.employees = [];

	$db
		.query(
			"SELECT * FROM EMPLOYEES AS e INNER JOIN Departments AS d ON d.department_id = e.department_id AND d.department = ?",
			[ department ]
		)
		.then( function( result ) {
			$scope.employees = $db.resultset( result );
		} );


###row()

Gets a single row from the resultset as an object

- `@result` The SQLResultSet object from a query
- `@index` (optional) The row index to retrieve, default 0

**Usage**

	var employee_id = 1;
	$scope.employee = {};
	$db
		.query(
			"SELECT * FROM Employees WHERE employee_id = ? LIMIT 1",
			[ employee_id ]
		)
		.then( function( result ) {
			$scope.employee = $db.row( result );
		} );

###drop()

Drops database objects i.e. tables, views, indexes

- `@object_name` The name of the object to drop
- `@object_type` The type of object to drop i.e. TABLE, INDEX, VIEW

**Usage:**
	
	$db.drop( "Employees", "TABLE" );


###index()

Drops and recreates an index on a table

- `@index_name` Name of the index to create to drop and recreate
- `@table` Table to create the index on
- `@columns` The columns to create the index for
- `@unique` (optional) Boolean for whether or not it is a unique index, default is `false`

**Usage:**
	
	$db.index( "idx_Employees_email", "Employees", [ "email" ], true );

###view()

Drops and recreates a view on a table

- `@view_name` Name of the index to drop and recreate
- `@statement` The SQL SELECT statement to use in the view
- `@temp` (optional) Whether or not the view is temporary, default is `false`

**Usage:**
	
	$db.view( 
		"vwITEmployees", 
		"SELECT e.employee_id, e.first_name, e.last_name, e.email, e.gender, e.birth_date, t.title, d.department, e.last_modified FROM Employees AS e INNER JOIN Titles AS t on t.title_id = e.title_id INNER JOIN Departments AS d ON d.department_id = e.department_id WHERE d.department = 'IT'", 				
		false );

###recreate()

Recreates the database by dropping and recreating all objects based on the config

**Usage:**
	
	$db.recreate();

###columns()

Gets all of the columns for a table based on its create statement

- `@table` The name of the table to get the columns for

**Usage:**

	$db
		.columns( "Employees" )
		.then( function( columns ) {
		
		} );





