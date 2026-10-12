import sys; sys.path.insert(0,'.')
from deadlines import C,items
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
ny=ZoneInfo("America/New_York"); u=ZoneInfo("UTC")
f=lambda d:d.astimezone(u).strftime("%Y%m%dT%H%M%SZ")
esc=lambda s:s.replace("\\","\\\\").replace(",","\\,").replace(";","\\;")
L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Student Fall 2026//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Fall 2026 Due Dates","X-WR-TIMEZONE:America/New_York"]
for i,(c,t,d,ty,n) in enumerate(items):
    due=datetime.strptime(d,"%Y-%m-%d %H:%M").replace(tzinfo=ny); st=due-timedelta(minutes=30)
    L+=["BEGIN:VEVENT",f"UID:student-f26-{i}@duedates",f"DTSTAMP:{f(datetime.now(u))}",f"DTSTART:{f(st)}",f"DTEND:{f(due)}",
        "SUMMARY:"+esc(f"DUE: {t} ({c})"),
        "DESCRIPTION:"+esc(f"{C[c]} · {ty}. Due {due.strftime('%a %b %-d at %-I:%M %p')}. {n}".strip()),
        "TRANSP:TRANSPARENT"]
    for trig,lab in [("-P2D","in 2 days"),("-P1D","tomorrow"),("-PT3H30M","in 4 hours")]:
        L+=["BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc(f"{t} is due {lab}"),f"TRIGGER:{trig}","END:VALARM"]
    L+=["END:VEVENT"]
L.append("END:VCALENDAR")
def fold(l):
    b=l.encode(); out=[]
    while len(b)>73:
        k=73
        while (b[k]&0xC0)==0x80: k-=1
        out.append(b[:k].decode()); b=b[k:]
    out.append(b.decode()); return "\r\n ".join(out)
L=[fold(x) for x in L]
open("Fall_2026_Due_Dates.ics","w",newline="").write("\r\n".join(L)+"\r\n")
print(len(items),"events")
