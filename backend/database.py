import sqlite3

# Connect to the database file (it will be created if it doesn't exist)
conn = sqlite3.connect('data.db')
cursor = conn.cursor()

# Create the contacts table
cursor.execute('''
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
)
''')

# Create the templates table
cursor.execute('''
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL
)
''')

# Save the changes and close the connection
conn.commit()
conn.close()

print("Database and tables created successfully.")