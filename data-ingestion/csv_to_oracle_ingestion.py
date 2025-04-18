import csv
from dotenv import load_dotenv
import cx_Oracle
import os
import sys
import oracledb

load_dotenv()

try:
    lib_dir = os.getenv("ORACLE_INSTANT_CLIENT")
    cx_Oracle.init_oracle_client(lib_dir=lib_dir)
except Exception as err:
    print("Whoops!")
    print(err)
    sys.exit(1)
    
host = os.getenv("ORACLE_HOST") + ":" + os.getenv("ORACLE_PORT") + "/" + os.getenv("ORACLE_DATABASE")

print(host)

# Set up Oracle DB connection
conn = oracledb.connect(
    user=os.getenv("ORACLE_USER_NAME"),
    password=os.getenv("ORACLE_PASSWORD"),
    dsn=os.getenv("ORACLE_HOST") + ":" + os.getenv("ORACLE_PORT") + "/" + os.getenv("ORACLE_DATABASE")
)
cursor = conn.cursor()

i = 0

# Open CSV file
with open('products.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)

    for row in reader:
        try:
            # Clean and transform data
            no_of_ratings = int(row['no_of_ratings'].replace(',', '')) if row['no_of_ratings'] else None
            ratings = float(row['ratings']) if row['ratings'] else None
            
            print(row)

            cursor.execute("""
                INSERT INTO SAMPLE.RUNNING_PRODUCTS (
                    name,
                    main_category,
                    sub_category,
                    image,
                    link,
                    ratings,
                    no_of_ratings,
                    discount_price,
                    actual_price
                ) VALUES (
                    :1, :2, :3, :4, :5, :6, :7, :8, :9
                )
            """, (
                row['name'],
                row['main_category'],
                row['sub_category'],
                row['image'],
                row['link'],
                ratings,
                no_of_ratings,
                row['discount_price'],
                row['actual_price']
            ))

        except Exception as e:
            print(f"Error inserting row: {row['name']} — {e}")
        
        i = i + 1
        
        if i > 50:
            break

# Commit and close connection
conn.commit()
cursor.close()
conn.close()

print("Data load complete.")
