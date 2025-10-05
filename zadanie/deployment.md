Prostredia:
Budeme mat dve prostredia. Aktalne budeme vyvijat len lokalne na dockerovych kontajneroch.

Neskor sa presunieme na server a spojazdnime aplikaciu na domene.

Databaza:

Databazu budeme pri MVP pouzivat len jednu vzdialenu. Mas pristup na server cez Digital Ocean MCP.

Na serveri zatial nie je nainstalovany PostgreSQL. Vytvor novy PostgreSQL cez Docker.

Na server sa dostanes s tymito udajmi.
- **IP**: 165.22.95.150
- **SSH**: `ssh -i ~/.ssh/monitra_do root@165.22.95.150

Bude potrebne aby si spravil tunel kvoli pristupu na databazu. Pomocne scripty davaj do adresara /scripts.

========

V podstate akekolvek pomocne scripty uloz do nejakych adresarov. 
Ak potrebujes docasny subor, alebo screenshoty pri testovani, tak si to uloz napriklad do adresara /tmp.