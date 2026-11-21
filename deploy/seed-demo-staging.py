"""Idempotent, explicitly labelled demonstration records for gym_stage only."""
from pathlib import Path
import shlex
import uuid

# Reuse the pinned connection and hidden password prompt, without running QA cleanup.
exec(Path('deploy/verify-staging.py').read_text(encoding='utf-8').split("qa_id =")[0])
def ident(kind, i):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'gym-stage-demo-v1/{kind}/{i}'))
sql = ["BEGIN; SET LOCAL timezone='Asia/Tehran';"]
for i in range(1, 81):
    phone = f'0900000{i:04d}'
    status = 'completed' if i <= 45 else ['new','contacted','cancelled'][i % 3]
    days = i % 28
    sql.append(f"INSERT INTO registration_requests(id,plan_id,full_name,phone,visit_date,status,owner_hash,price_snapshot,plan_name_snapshot,duration_snapshot,created_at) VALUES('{ident('request',i)}','single-30-1','عضو نمایشی {i:02d}','{phone}',CURRENT_DATE+{i%5},'{status}','demo-stage-v1-{i}',3000000,'پکیج سینگل — نمایشی','ماهانه',NOW()-INTERVAL '{days} days') ON CONFLICT(id) DO NOTHING;")
    if i <= 45:
        sql.append(f"INSERT INTO gym_members(phone,name,status,expires_on,notes,created_at) VALUES('{phone}','عضو نمایشی {i:02d}','active',CURRENT_DATE+30,'داده ساختگی برای نمایش پنل؛ مشتری واقعی نیست.',NOW()-INTERVAL '{days} days') ON CONFLICT(phone) DO NOTHING;")
    if i <= 15:
        sql.append(f"INSERT INTO gym_ledger(id,kind,amount,title,phone,occurred_on) VALUES('{ident('income',i)}','income',3000000,'دریافت نمایشی عضویت — عضو {i:02d}','{phone}',CURRENT_DATE-{i%14}) ON CONFLICT(id) DO NOTHING;")
    if i <= 22:
        sql.append(f"INSERT INTO gym_attendance(id,phone,checked_at) VALUES('{ident('attendance',i)}','{phone}',NOW()-INTERVAL '{i%3} days'-INTERVAL '{i%6} hours') ON CONFLICT(id) DO NOTHING;")
for i, title in enumerate(['نظافت','تعمیر تجهیزات','ملزومات باشگاه'],1):
    sql.append(f"INSERT INTO gym_ledger(id,kind,amount,title,occurred_on) VALUES('{ident('expense',i)}','expense',2000000,'هزینه نمایشی {title}',CURRENT_DATE-{i}) ON CONFLICT(id) DO NOTHING;")
sql += ["COMMIT;", "SELECT COUNT(*) AS demo_requests FROM registration_requests WHERE owner_hash LIKE 'demo-stage-v1-%';", "SELECT kind,SUM(amount) FROM gym_ledger WHERE title LIKE '%نمایشی%' GROUP BY kind;"]
assert run('readlink -f /srv/gym-test/current').startswith('/srv/gym-test/releases/')
print(run('runuser -u postgres -- psql -v ON_ERROR_STOP=1 gym_stage -c ' + shlex.quote('\n'.join(sql))))
client.close()
