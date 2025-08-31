from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)  # This enables Cross-Origin Resource Sharing

DATABASE = 'data.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # This allows us to access columns by name
    return conn

# --- API Endpoints for Contacts ---

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    conn = get_db_connection()
    contacts = conn.execute('SELECT * FROM contacts').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in contacts])

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    new_contact = request.get_json()
    conn = get_db_connection()
    conn.execute('INSERT INTO contacts (name, email) VALUES (?, ?)',
                 (new_contact['name'], new_contact['email']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'}), 201

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

# --- API Endpoints for Templates ---

@app.route('/api/templates', methods=['GET'])
def get_templates():
    conn = get_db_connection()
    templates = conn.execute('SELECT * FROM templates').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in templates])

@app.route('/api/templates', methods=['POST'])
def add_template():
    new_template = request.get_json()
    conn = get_db_connection()
    conn.execute('INSERT INTO templates (title, subject, body) VALUES (?, ?, ?)',
                 (new_template['title'], new_template['subject'], new_template['body']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'}), 201
    
@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM templates WHERE id = ?', (template_id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(debug=True)