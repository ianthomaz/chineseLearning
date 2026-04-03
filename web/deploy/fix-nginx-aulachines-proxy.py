#!/usr/bin/env python3
"""One-off: replace static aulaChines alias with proxy to host PM2 (Docker bridge)."""
from datetime import datetime, timezone
from pathlib import Path
import shutil

path = Path("/home/opc/projetos/webplaceMain/nginx/conf.d/default.conf")
backup_name = f"default.conf.bak.aulachines_proxy.{datetime.now(tz=timezone.utc).strftime('%Y%m%d%H%M%S')}"
backup_same_dir = path.parent / backup_name
backup_tmp = Path("/tmp") / backup_name
try:
    shutil.copy2(path, backup_same_dir)
except OSError:
    shutil.copy2(path, backup_tmp)
    print(f"backup → {backup_tmp} (conf.d dir not writable for new files)")
else:
    print(f"backup → {backup_same_dir}")

s = path.read_text()
# HTTP block includes comment; HTTPS block often has only the location (same alias body).
old_loc = """    location /aulaChines/ {
        alias /home/opc/projetos/chineseLearning/;
        index index.html;
        try_files $uri $uri.html $uri/ /aulaChines/index.html;
    }"""
new_loc = """    location /aulaChines/ {
        proxy_pass http://172.17.0.1:34827;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }"""
n = s.count(old_loc)
if n != 2:
    raise SystemExit(f"expected 2 location blocks, found {n}")
s = s.replace(old_loc, new_loc)
# Refresh comment on first occurrence only (optional clarity)
old_comment = """    # Aula de Chinês
    location /aulaChines/ {
        proxy_pass http://172.17.0.1:34827;"""
new_comment = """    # Aula de Chinês — Next.js + tutor (PM2 host :34827)
    location /aulaChines/ {
        proxy_pass http://172.17.0.1:34827;"""
if old_comment in s:
    s = s.replace(old_comment, new_comment, 1)
path.write_text(s)
print("replaced 2 location blocks OK")
