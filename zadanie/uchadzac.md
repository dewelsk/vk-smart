V zozname uzivatelov mame aj uchadzacov

Problem je v tom, ze uchadzac nebude len 1x v tejto tabulke

Moze sa stat, ze jeden uchadzac sa prihlasi na 3 vyberove konania. Podla logiky by sme ho mali vytvorit v tabulke users 3x

Mame tabulku candidates.

Mne pride logicke odstranit uchadzacov z tabulky users a presunut ich do candidates.

Vyhody:
Login je aj tak oodeleny. Uchadzaci sa prihlasuju cez username (co je CIS ID) 

Pri logine uchadzaca by si pozeral do tabulky candidates

Aj z pohladu bezpecnosti to dava vyhodu. Uchadzaci su uplne oddeleny od adminov, gestorov, komisie ...

Zoznam Uchadzacov bude brat informacie z 

Tym padom mozeme mat v tabulke candidates toho isteho uzivatela aj 5x. Vzdy ale bude naparovany na tabulku vyberove_konania

Vsetky obrazovky, E2E testy, backend testy, API volania ktore robili s rolou UCHADZAC a chodili do tabulku users je potrebne prepisat