// Add database package and connection string (can remove ssl)
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

console.log("Successful connection to the database");

const sql_create = `DROP TABLE IF EXISTS book;
CREATE TABLE book (
	book_id	VARCHAR(10) PRIMARY KEY,
	title	VARCHAR(255),
	total_pages	INTEGER,
	rating	NUMERIC,
	isbn	VARCHAR(20),
	published_date	DATE
);`;




//Create inital DB
pool.query(sql_create, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'books' table");

  // Database seeding
  const sql_insert = `INSERT INTO book (book_id, title, total_pages, rating, isbn, published_date) VALUES 
  ('1001','Lean Software Development: An Agile Toolkit',240,4.17,'9780320000000','2003-05-18'),
  ('1002','Facing the Intelligence Explosion',91,3.87,NULL,'2013-02-01'),
  ('1003','Scala in Action',419,3.74,'9781940000000','2013-04-10'),
  ('1004','Patterns of Software: Tales from the Software Community',256,3.84,'9780200000000','1996-08-15'),
  ('1005','Anatomy Of LISP',446,4.43,'9780070000000','1978-01-01'),
  ('1006','Computing machinery and intelligence',24,4.17,NULL,'2009-03-22'),
  ('1007','XML: Visual QuickStart Guide',269,3.66,'9780320000000','2009-01-01'),
  ('1008','SQL Cookbook',595,3.95,'9780600000000','2005-12-01'),
  ('1009','The Apollo Guidance Computer: Architecture And Operation (Springer Praxis Books / Space Exploration)',439,4.29,'9781440000000','2010-07-01'),
  ('1010','Minds and Computers: An Introduction to the Philosophy of Artificial Intelligence',222,3.54,'9780750000000','2007-02-13'),
  ('1011','The Architecture of Symbolic Computers',739,4.5,'9780070000000','1990-11-01'),
  ('1012','Exceptional Ruby: Master the Art of Handling Failure in Ruby',102,4,NULL,NULL),
  ('1013','Nmap Network Scanning: The Official Nmap Project Guide to Network Discovery and Security Scanning',468,4.32,'9780980000000','2009-01-01'),
  ('1014','The It Handbook for Business: Managing Information Technology Support Costs',180,4.4,'9781450000000','2010-09-17'),
  ('1015','Accidental Empires',384,4,'9780890000000','1996-09-13');`;
  pool.query(sql_insert, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
  });
});

const getTotalRecords = () => {
    sql = "SELECT COUNT(*) FROM book";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};

//Gets 3 random items from an array
function get3Random(items)
{
    for (i = 0; i < 3; ++i )
    {
        var rIdx = i + Math.floor( Math.random() * (items.length - i) );
        var temp = items[ i ];
        items[ i ] = items[ rIdx ];
        items[ rIdx ] = temp;
    }

    return items.slice( 0, 3 );
}

//Finds customers similar to given customer, with optional sorting
const findCustomers = ( customer, sortType ) => {
    // Will build query based on data provided from the form
    //  Use parameters to avoid sql injection

    // Declare variables
    var i = 0;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if ( customer.cusId && customer.cusId !== "") {
        params.push(parseInt(customer.cusId));
        sql += ` AND cusId = ${params[i]}`;
        i++;
    };
    if (customer.cusFname && customer.cusFname !== "") {
        params.push(`${customer.cusFname}%`);
        sql += ` AND cusFname ILIKE '${params[i]}'`;
        i++;
    };
    if ( customer.cusLname && customer.cusLname !== "") {
        params.push(`${customer.cusLname}%`);
        sql += ` AND cusLname ILIKE '${params[i]}'`;
        i++;
    };
    if ( customer.cusState && customer.cusState !== "") {
        params.push(`${customer.cusState}%`);
        sql += ` AND cusState ILIKE '${params[i]}'`;
        i++;
    };
    if ( customer.cusSalesYTD && customer.cusSalesYTD !== "") {
        params.push(parseFloat(customer.cusSalesYTD));
        sql += ` AND cusSalesYTD >= '\$${params[i]}'`;
        i++;
    };
    if ( customer.cusSalesPrev && customer.cusSalesPrev !== "") {
        params.push(parseFloat(customer.cusSalesPrev));
        sql += ` AND cusSalesPrev >= '\$${params[i]}'`;
        i++;
    };

    if( sortType == "customersByName" )
    {
        sql += ` ORDER BY cusLname, cusFname`;
    }
    else if( sortType == "customersBySales" )
    {
        sql += ` ORDER BY cusSalesYTD DESC`;
    }
    else
    {
        sql += ` ORDER BY cusId`;
    }

    // for debugging
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql)
        .then(result => {

            if( sortType == "customersRandom" )
            {
                if( result.rows.length < 3 )
                {
                    return {
                        trans: "Error",
                        result: `Error: "3 Customers not available"`
                    }
                }
                else
                {
                    //shuffle( result.rows );
                    return { 
                        trans: "success",
                        result: get3Random( result.rows )
                    }
                }
            }
            else
            {
                console.log( "Find Success!" );
                console.log( "Rows returned: " + result.rows.length );
                return { 
                    trans: "success",
                    result: result.rows
                }
            }
        })
        .catch(err => {
            console.log( "Find Error!" );
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

//Adds new customer
const insertBook = (book) => {
    var i = 0;
    params = [];
    
    params.push(`${book.book_id}`);  
    i++;

    params.push(`${book.title}`);  
    i++;

    params.push(`${book.total_pages}`);
    i++;

    params.push(`${book.rating}`);
    i++;

    params.push(`${book.isbn}`);
    i++;

    params.push(`${book.published_date}`);
    i++;

    const sql = `INSERT INTO book (book_id, title, total_pages, rating, isbn, published_date)  
                 VALUES ($1, $2, $3, $4, $5, $6)`;

                 
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success", 
                result: `book ${book.book_id} ${book.title} successfully inserted`
            };
        })
        .catch(err => {
            return {
                trans: "error", 
                result: `Error on insert of book ${book.book_id} ${book.title}.  ${err.message}`
            };
        });
};

//Updates existing customer
const updateCustomer = (customer) => {
    var i = 0;
    params = [];
    
    params.push(`${customer.cusId}`);  
    i++;

    params.push(`${customer.cusFname}`);  
    i++;

    params.push(`${customer.cusLname}`);
    i++;

    if (customer.cusState !== "") {
        params.push(`${customer.cusState}`);
    }
    else
    {
        params.push(``);
    }
    i++;
    
    if (customer.cusSalesYTD !== "") {
        params.push( "$" + parseFloat(customer.cusSalesYTD) );
    }
    else
    {
        params.push( "$0.00" );
    }
    i++;

    if (customer.cusSalesPrev !== "") {
        params.push( "$" + parseFloat(customer.cusSalesPrev) );
    }
    else
    {
        params.push( "$0.00" );
    }
    i++;
    
    const sql = `UPDATE customer
                SET cusFname = $2,
                    cusLname = $3,
                    cusState = $4,
                    cusSalesYTD = $5,
                    cusSalesPrev = $6
                WHERE cusId = $1`;

                 
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success", 
                result: `customer ${params[0]} ${params[1]} successfully updated`
            };
        })
        .catch(err => {
            return {
                trans: "error", 
                result: `Error on update of customer ${params[0]} ${params[1]}.  ${err.message}`
            };
        });
};

//Remove customer
const deleteCustomer = (customer) => {
    var i = 0;
    params = [];
    params.push(`${customer.cusId}`);  
    i++;

    const sql = `DELETE FROM customer
                WHERE cusId = $1`;

                 
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success", 
                result: `customer ${params[0]} successfully deleted`
            };
        })
        .catch(err => {
            return {
                trans: "error", 
                result: `Error on delete of customer ${params[0]}.  ${err.message}`
            };
        });
};

//Define export points
module.exports.getTotalRecords = getTotalRecords;
module.exports.findCustomers = findCustomers;
module.exports.insertBook = insertBook;
module.exports.updateCustomer = updateCustomer;
module.exports.deleteCustomer = deleteCustomer;