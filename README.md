# ng-localstorage

This is a wrapper for localStorage for Angular JS.  Each of the implemented methods use promises.

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
