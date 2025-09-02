import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text, inspect

app = Flask(__name__)
CORS(app)

# Railway will automatically provide this environment variable
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    # A fallback for local testing if you want to set it up later
    raise RuntimeError("DATABASE_URL environment variable is not set.")

engine = create_engine(DATABASE_URL)

def create_tables_if_not_exist():
    """Checks for tables and creates them if they don't exist."""
    inspector = inspect(engine)
    with engine.connect() as conn:
        if not inspector.has_table("templates"):
            conn.execute(text("""
            CREATE TABLE templates (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL
            );
            """))
        conn.commit()

# --- API Endpoints ---

@app.route('/api/templates', methods=['GET'])
def get_templates():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM templates ORDER BY title;"))
        templates = [dict(row._mapping) for row in result]
        return jsonify(templates)

@app.route('/api/templates', methods=['POST'])
def add_template():
    new_template = request.get_json()
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO templates (title, subject, body) VALUES (:title, :subject, :body);"),
                     new_template)
        conn.commit()
    return jsonify({'status': 'success'}), 201
    
@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM templates WHERE id = :id;"), {"id": template_id})
        conn.commit()
    return jsonify({'status': 'success'})

# Create tables on startup
create_tables_if_not_exist()

# The PORT is also provided by Railway automatically
port = int(os.environ.get('PORT', 8080))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)