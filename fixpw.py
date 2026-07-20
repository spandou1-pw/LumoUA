import subprocess, sys

# Step 1: generate hash with node
result = subprocess.run(
    ['node', '-e', "const a=require('argon2');a.hash('Edina2024!').then(h=>process.stdout.write(h))"],
    capture_output=True, text=True,
    cwd='/opt/LumoUA/backend'
)
hash_val = result.stdout.strip()
if not hash_val:
    print('ERROR:', result.stderr)
    sys.exit(1)
print('Generated hash:', hash_val[:30], '...')

# Step 2: update DB with psycopg2
import psycopg2
conn = psycopg2.connect(host='localhost', dbname='edina_prod', user='edina', password='edina_prod_Ua9kQ2m')
cur = conn.cursor()
cur.execute("UPDATE users SET password_hash = %s WHERE email = 'spandou1@gmail.com'", (hash_val,))
conn.commit()
print(f'Updated {cur.rowcount} rows')

cur.execute("SELECT password_hash FROM users WHERE email='spandou1@gmail.com'")
stored = cur.fetchone()[0]
print('Stored hash matches:', stored == hash_val)
cur.close()
conn.close()
