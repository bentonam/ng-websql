var app = angular.module("exampleApp", ["ngWebSql"]);

// database config
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
} )
app.constant( "TITLES", [
	"Developer",
	"Designer",
	"Architect",
	"Manager"
] )
app.constant( "DEPTS", [
	"IT",
	"Creative",
	"HR"
] )
app.constant( "EMPLOYEES", [
	{
		first_name: "John",
		last_name: "Doe",
		email: "john.doe@mail.com",
		gender: "M",
		birth_date: "1990-25-01",
		title_id: 1,
		department_id: 1
	},
	{
		first_name: "George",
		last_name: "Smith",
		email: "george.smith@mail.com",
		gender: "M",
		birth_date: "1988-17-05",
		title_id: 3,
		department_id: 1
	},
	{
		first_name: "Michael",
		last_name: "Jones",
		email: "michael.jones@mail.com",
		gender: "M",
		birth_date: "1989-14-08",
		title_id: 4,
		department_id: 1
	},
	{
		first_name: "Jane",
		last_name: "Doe",
		email: "jane.doe@mail.com",
		gender: "F",
		birth_date: "1991-25-02",
		title_id: 2,
		department_id: 2
	}
] )
app.run( function( $db, DB_CONFIG, TITLES, DEPTS, EMPLOYEES ){
		// initialize the database and pre-populate tables
		$db
			.init( DB_CONFIG )
			.then( function(){ // add the titles
				angular.forEach( TITLES, function( title ) {
					$db.query(
						"INSERT OR IGNORE INTO Titles( title ) VALUES( ? )",
						[ title ]
					);
				} );
			} )
			.then( function(){ // add the departments
				angular.forEach( DEPTS, function( dept ) {
					$db.query(
						"INSERT OR IGNORE INTO Departments( department ) VALUES( ? )",
						[ dept ]
					);
				} );
			} )
			.then( function(){ // add the employees
				angular.forEach( EMPLOYEES, function( employee ) {
					$db.query(
						"INSERT OR IGNORE INTO Employees( first_name, last_name, email, gender, birth_date, title_id, department_id ) VALUES( ?, ?, ?, ?, ?, ?, ? )",
						[ employee.first_name, employee.last_name, employee.email, employee.gender, employee.birth_date, employee.title_id, employee.department_id ]
					);
				} );
			} );
		return;

})
app.controller("AppCtrl", function( $scope, $db ){

} );