# Projekt Królestwo
Projekt królestwo ma za cel rozwiązanie problemów dotykających królestwa. Dzięki skorzystaniu z technologii konteneryzacji jest to pełnoprawne międzyplatformowe narzędzie, które można uruchomić na każdym komputerze z dockerem.

### Uruchamianie projektu
**! Uwaga !** Do uruchomienia poniższego kodu wymagane jest posiadanie **Dockera** oraz **Docker compose** na swojej maszynie, a dokładniej Docker-cli aby móc uruchamiać konteneryzację za pomocą komend. W przypadku korzystania z Dockera w wersji z GUI  należy zastąpić komendy odpowiednimi akcjami.
Na dzień dzisiejszy **Docker-compose** instaluje się wraz z dockerem - jeśli jednak tak by się nie stało, należy pobrać dodatkowo taki plugin.

#### .env
W głównym folderze projektu należy dodać plik .env (*src/.env*) i skonfigurować tam dane użytkownika do bazy danych. Przykladowe dane: 
```
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=database
DB_HOST=db
DB_PORT=5432
```
#### Linux
```python
mkdir project
cd project
git clone https://github.com/JabloZ/AiSD-II-Projekt.git
docker compose up --build
```

## Technologie
W projekcie zastosowano **konteneryzację (Docker)**, dzięki czemu każdy z członków zespołu mimo różnych środowisk technologicznych (a nawet systemów operacyjnych) 

| Technologia | Użyto      |
| ------------- | ------ |
| C#            | ✅ Tak |
| Docker        | ✅ Tak |
| PostgreSQL        | ✅ Tak |
| Python        | ✅ Tak |
| Next.js        | ✅ Tak |

### Kontenery:
**backend** - Używa oficjalnego obrazu .NET SDK (**mcr.microsoft.com/dotnet/sdk:10.0**) od Microsoftu. To tutaj znajduje się serce projektu - Tutaj znajduje się implementacja algorytmów, testy jednostkowe 
**frontend** - Używa obrazu Node.js **(20-alpine)**
**db** - Używa obrazu postgresql'a (**postgres:18.3-alpine**). W tym kontenerze przechowywane są dane potrzebne do obliczenia wyników algorytmów.
**generate** - Używa gotowego obrazu pythona.(**python:3.9**) Ten kontener odpowiada za losowe generowanie przykładowych danych. Nie jest on niezbędny do uruchomienia projektu, jeśli wprowadzamy swoje dane.

# Problemy
1. Najoptymalniejsze przypisanie krasnoludów do kopalń.
2. Objazd kopalń przez księcia.
3. Wybór najgłośniejszego krasnoluda na atakowanym odcinku granicy.
4. Elektroniczne księgi - kompresja.

## Metoda rozwiązania problemów

### 1. Najoptymalniejsze przypisanie krasnoludów do kopalń.
W projekcie zastosowano algorytm **Min-Cost Max-Flow (MCMF)** do rozwiązania problemu optymalnego przypisania krasnoludków do kopalni. Celem jest zapewnienie pracy jak największej liczbie krasnoludków przy jednoczesnym zminimalizowaniu całkowitego dystansu, jaki muszą pokonać ze swoich domów do złóż. W algorytmie zastosowano algorytm Bellmana-Forda.

- **Złożoność: O(E\*V\*F)**, gdzie F to maksymalny przepływ (liczba krasnoludków), E to liczba krawędzi, a 
 Vliczba węzłów.
- **Stop:** Algorytm kończy działanie, gdy w sieci rezydualnej nie istnieje żądna ścieżka od ujścia do źródła.

Implementacja algorytmu znajduje się w **src/backend/Algorithms/AssignmentSolver.cs**

## Testy
Poprawność i niezawodność każdego z algorytmów jest przez nas sprawdzana w testach jednostkowych
Uruchomienie testów:
```
cd src/backend/krasnoludki.Tests
dotnet test
```

To be continued...


Jakub Jabłoński, Kamil Hys, Miłosz Puchalski, Irek Polak.