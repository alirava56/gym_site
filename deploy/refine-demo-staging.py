"""Natural synthetic fixtures; only modifies the previously seeded staging rows."""
from pathlib import Path
import random
import shlex
import uuid
exec(Path('deploy/verify-staging.py').read_text(encoding='utf-8').split('qa_id =')[0])
r = random.Random(927183)
first = ['امیرحسین','علی','محمدرضا','حسین','رضا','مهدی','آرمان','پارسا','نیما','سامان','سینا','آرش','کیان','پوریا','شایان','بهراد','سعید','وحید','فرهاد','پیمان']
last = ['احمدی','رضایی','کریمی','محمدی','حسینی','مرادی','صادقی','اکبری','رحیمی','جعفری','قاسمی','نوری','موسوی','شریفی','حیدری','کاظمی','رستمی','یزدانی','امینی','بهرامی']
pairs = r.sample([(a,b) for a in first for b in last],80)
sql=['BEGIN;']
used=set()
amounts=[1850000,2250000,2750000,3200000,4100000,1950000,3650000,2850000,4250000,2350000,3350000,2450000,3750000,2950000]
amounts.append(45000000-sum(amounts))
for i,(a,b) in enumerate(pairs,1):
    old=f'0900000{i:04d}'
    phone=r.choice(['0902','0998','0912','0935','0919','0936'])+str(r.randrange(1000000,9999999))
    while phone in used:
        phone='0902'+str(r.randrange(1000000,9999999))
    used.add(phone)
    name=a+' '+b
    rid=str(uuid.uuid5(uuid.NAMESPACE_URL,f'gym-stage-demo-v1/request/{i}'))
    sql.append(f"INSERT INTO gym_members(phone,name,status,expires_on,notes,created_at) SELECT '{phone}','{name}',status,expires_on,notes,created_at FROM gym_members WHERE phone='{old}' AND notes LIKE 'داده ساختگی%' ON CONFLICT(phone) DO NOTHING;")
    sql.append(f"UPDATE registration_requests SET full_name='{name}',phone='{phone}',plan_name_snapshot='پکیج سینگل' WHERE id='{rid}' AND owner_hash='demo-stage-v1-{i}';")
    if i<=45:
        sql.append(f"UPDATE gym_attendance SET phone='{phone}' WHERE phone='{old}';")
        sql.append(f"UPDATE gym_ledger SET phone='{phone}' WHERE phone='{old}' AND title LIKE '%نمایشی%';")
        sql.append(f"DELETE FROM gym_members WHERE phone='{old}' AND notes LIKE 'داده ساختگی%';")
    if i<=15:
        lid=str(uuid.uuid5(uuid.NAMESPACE_URL,f'gym-stage-demo-v1/income/{i}'))
        sql.append(f"UPDATE gym_ledger SET amount={amounts[i-1]},title='دریافت عضویت — {name}' WHERE id='{lid}';")
for i,title in enumerate(['نظافت','تعمیر تجهیزات','ملزومات باشگاه'],1):
    lid=str(uuid.uuid5(uuid.NAMESPACE_URL,f'gym-stage-demo-v1/expense/{i}'))
    sql.append(f"UPDATE gym_ledger SET title='{title}' WHERE id='{lid}';")
sql += ['COMMIT;',"SELECT COUNT(*) FROM registration_requests WHERE owner_hash LIKE 'demo-stage-v1-%';",'SELECT kind,SUM(amount) FROM gym_ledger GROUP BY kind;']
print(run('runuser -u postgres -- psql -q -v ON_ERROR_STOP=1 gym_stage -c '+shlex.quote('\n'.join(sql))))
client.close()
