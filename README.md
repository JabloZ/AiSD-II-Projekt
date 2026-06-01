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
| Node.js        | ✅ Tak |

### Kontenery:
- **backend** - Używa oficjalnego obrazu .NET SDK (**mcr.microsoft.com/dotnet/sdk:10.0**) od Microsoftu. To tutaj znajduje się serce projektu - Tutaj znajduje się implementacja algorytmów, testy jednostkowe 
- **frontend** - Używa obrazu Node.js, część wizualna projektu. **(20-alpine)**
- **db** - Używa obrazu postgresql'a (**postgres:18.3-alpine**). W tym kontenerze przechowywane są dane potrzebne do obliczenia wyników algorytmów.
- **generate** - Używa gotowego obrazu pythona.(**python:3.9**) Ten kontener odpowiada za losowe generowanie przykładowych danych. Nie jest on niezbędny do uruchomienia projektu, jeśli wprowadzamy swoje dane.

### Struktura projektu
```plaintext

├── src/
│   ├── backend/
│   │   ├── krasnoludki/
│   │   │   ├── Algorithms/           # Algorytmy (+ pliki z klasami Edges)
│   │   │   │   ├── AssignmentSolver.cs
│   │   │   │   ├── BorderDefenseSolver.cs
│   │   │   │   ├── HuffmanSolver.cs
│   │   │   │   └── PatrolSolver.cs
│   │   │   ├── Database/
│   │   │   │   └── DatabaseConn.cs
│   │   │   ├── Entities/             # Definicje klas
│   │   │   ├── Repositories/         # Obsługa danych dla klas
│   │   │   └── Program.cs
│   │   │
│   │   └── krasnoludki.Tests/
│   │       ├── DbIntegrity.cs
│   │       ├── UnitTest1.cs
│   │       ├── UnitTest2.cs
│   │       ├── UnitTest3.cs
│   │       ├── UnitTest4.cs
│   │       └── UnitTest5.cs
│   │
│   ├── db/
│   │   └── init.sql
│   │
│   ├── frontend/
│   │
│   └── generate/
│       └── generate.py
│
├── .gitignore
└── README.md
```

# Problemy
1. Najoptymalniejsze przypisanie krasnoludów do kopalń.
2. Objazd kopalń przez księcia.
3. Wybór najgłośniejszego krasnoluda na atakowanym odcinku granicy.
4. Elektroniczne księgi - kompresja.
5. Elektroniczne księgi - wyszukiwanie informacji.

   
## Metoda rozwiązania problemów

### 1. Najoptymalniejsze przypisanie krasnoludów do kopalń.
W tej części projektu użyliśmy sieci przepływowych i algorytmu **Min-Cost Max-Flow (MCMF)**, żeby przypisać krasnale do odpowiednich kopalń. Chodzi o to, żeby zatrudnić jak najwięcej krasnoludków (Max Flow), ale jednocześnie zminimalizować łączny dystans, jaki muszą codziennie deptać z domów do pracy (Min Cost). Do szukania najkrótszych ścieżek w sieci rezydualnej wykorzystaliśmy algorytm Bellmana-Forda, ponieważ w grafie pojawiają się ujemne wagi (koszty krawędzi powrotnych).

- **Złożoność:** $O(F \cdot E \cdot V)$, gdzie $F$ to maksymalny przepływ (liczba krasnali), $E$ to liczba krawędzi, a $V$ to liczba węzłów w grafie.
- **Kiedy algorytm kończy działanie (Stop):** Pętla `while(true)` przerywa pracę, gdy algorytm Bellmana-Forda nie jest już w stanie znaleźć żadnej nowej ścieżki z superźródła (`Source`) do superujścia (`Sink`) o dodatniej przepustowości.

#### Jak to działa w kodzie krok po kroku:
1. **Budowanie grafu (`BuildGraph`):** Tworzymy sztuczne węzły `Source` oraz `Sink`. Następnie generujemy sieć połączeń:
   - **Źródło -> Krasnale:** Przepustowość wynosi 1 (jeden krasnal to jeden etat), koszt to 0.
   - **Kopalnie -> Ujście:** Przepustowość jest równa pojemności kopalni (`deposit.Capacity`), koszt to 0.
   - **Krasnale -> Kopalnie:** Krawędź powstaje tylko wtedy, gdy krasnal lubi dany minerał (`multiplier > 0`). Przepustowość to 1, a kosztem jest rzeczywisty dystans z domu krasnala do kopalni. Każda krawędź dostaje też swoją krawędź rezydualną z kosztem `-cost`, co pozwala algorytmowi "cofać" błędne decyzje.
2. **Szukanie ścieżki (Bellman-Ford):** W pętli szukamy najtańszej drogi z `Source` do `Sink`. Relaksacja krawędzi wykonuje się maksymalnie $V-1$ razy. Jeśli koszt dojścia do ujścia wynosi `double.MaxValue`, kończymy algorytm.
3. **Pchanie przepływu:** Po znalezieniu ścieżki szukamy jej wąskiego gardła (`pushFlow`) i aktualizujemy sieć. Zwiększamy przepływ na głównej krawędzi i zmniejszamy na rezydualnej.
4. **Zapisanie wyników:** Na koniec, na podstawie krawędzi, na których `Flow > 0`, przypisujemy konkretne obiekty kopalń do właściwości `Deposit` w encjach krasnoludków.

Implementacja algorytmu znajduje się w **src/backend/krasnoludki/Algorithms/AssignmentSolver.cs**

<br> <br>

### 2. Wyznaczanie trasy patrolowej wokół osady i kopalń.
Do wyznaczenia optymalnej trasy patrolowej użyliśmy algorytmu **Grahama (Graham Scan)**, który służy do znajdowania otoczki wypukłej. Chodzi o to, żeby wytyczyć najkrótszą, zamkniętą ścieżkę wokół wszystkich domków krasnali i kopalń na mapie. Taka trasa pozwala strażnikom kontrolować całe terytorium bez wchodzenia niepotrzebnie w głąb osady, oszczędzając czas przy obchodzie.

- **Złożoność:** $O(N \log N)$, gdzie $N$ to łączna liczba punktów na mapie. O czasie wykonania decyduje sortowanie kątowe, bo samo późniejsze przejście stosem działa już liniowo $O(N)$.
- **Kiedy algorytm kończy działanie (Stop):** Algorytm stopuje się po przeanalizowaniu wszystkich przefiltrowanych punktów i zwraca gotową listę wierzchołków tworzących zamknięty wielokąt (ścieżkę patrolu).

#### Kroki algorytmu w kodzie:
1. **Zrzucenie danych do jednej listy (`PatrolPoint`):** Najpierw wrzucamy domki (`House`) i kopalnie (`Deposit`) do wspólnej listy obiektów pomocniczych, żeby wygodnie operować na współrzędnych $X, Y$. Jeśli na mapie mamy mniej niż 3 punkty, od razu je zwracamy, bo nie da się z nich zrobić wielokąta.
2. **Szukanie punktu bazowego (Pivot):** Algorytm szuka punktu, który leży najniżej na mapie (najmniejsze $Y$). W przypadku remisu bierze ten bardziej po lewej stronie (najmniejsze $X$). Punkt ten ląduje na początku listy jako baza do dalszych obliczeń.
3. **Sortowanie biegunowe:** Sortujemy resztę punktów według kąta względem naszej bazy przy użyciu iloczynu wektorowego (`CrossProduct`). Jeśli trafimy na punkty leżące na jednej prostej (współliniowe), bliższy punkt ląduje wcześniej, a pętla filtrująca usuwa go, zostawiając do obliczeń tylko ten najdalej wysunięty.
4. **Przejście stosem (Graham Scan):** Wrzucamy na stos trzy pierwsze punkty. Potem lecimy pętlą przez resztę i sprawdzamy warunek zakrętu. Dopóki sprawdzane punkty nie robią "skrętu w lewo" (`CrossProduct <= 0`), zdejmujemy elementy ze stosu (`stack.Pop()`), bo oznacza to, że dany punkt chowa się do wnętrza osady. Na stosie zostają tylko te, które budują zewnętrzną granicę.

Implementacja algorytmu znajduje się w **src/backend/krasnoludki/Algorithms/PatrolSolver.cs**

<br> <br>
 
### 3. Wyznaczanie dowódcy odcinka obronnego (Obrona granic).
Do szybkiego szukania szefa na danym odcinku muru użyliśmy **drzewa przedziałowego (Segment Tree)**. Zasada wyboru jest prosta: dowodzi krasnal, który najgłośniej krzyczy (`Loudness`), żeby w razie ataku sprawnie wydać rozkazy. Zamiast za każdym razem przeszukiwać tablicę zwykłą pętlą, drzewo pozwala wyciągnąć najgłośniejszego krasnala w czasie logarytmicznym, co bardzo pozytywnie wpływa na wydajność.

- **Złożoność:**
  - **Budowanie:** $O(N)$ – odpala się raz w konstruktorze, gdzie $N$ to liczba krasnali na murze.
  - **Zapytanie (Query):** $O(\log N)$ – błyskawiczne wyciąganie dowódcy dla przedziału $[L, R]$.
- **Pamięć:** $O(N)$ – tablica o rozmiarze $4 \cdot N$. Taki zapas jest potrzebny, żeby przy strukturze drzewa binarnego nie wyjść poza zakres.
- **Kiedy algorytm kończy działanie (Stop):** Przy budowaniu – gdy zejdziemy do pojedynczych liści ($start == end$). Przy zapytaniu – gdy trafimy na węzeł, który idealnie pokrywa nasz przedział lub jest całkowicie poza nim.

#### Kroki algorytmu w kodzie:
1. **Budowanie drzewa (`Build`):** Rekurencyjnie tniemy tablicę krasnali na pół, aż dojdziemy do pojedynczych osób (liści). Wracając w górę drzewa, porównujemy lewego i prawego kandydata i do rodzica przypisujemy tego, który ma większe `Loudness`.
2. **Szukanie dowódcy (`Query`):** Podajemy przedział $[L, R]$, który nas interesuje. Algorytm idzie po drzewie i sprawdza warunki:
   - **Poza zakresem:** Węzeł nie pokrywa się z zapytaniem (zwraca `null`).
   - **Pełne pokrycie:** Węzeł idealnie mieści się w szukanym przedziale (zwraca z góry obliczonego najgłośniejszego krasnala).
   - **Częściowe pokrycie:** Zakres węzła tylko częściowo nachodzi na nasz przedział. Wtedy algorytm schodzi głębiej do lewego i prawego dziecka, porównuje wyniki i zwraca głośniejszego z nich.

Implementacja algorytmu znajduje się w **src/backend/krasnoludki/Algorithms/BorderDefenseSolver.cs**

<br> <br>
### 4. Kompresja logów systemowych (Algorytm Huffmana).
W celu zaoszczędzenia miejsca na dysku oraz optymalizacji przechowywania logów operacyjnych zaimplementowaliśmy bezstratną kompresję danych przy użyciu **algorytmu Huffmana**. Pozwala on na znaczne zmniejszenie rozmiaru plików z logami poprzez zamianę standardowego kodowania (gdzie każdy znak zajmuje 8 bitów) na kody o zmiennej długości. Ponieważ w logach pewne frazy, znaki czy cyfry powtarzają się masowo, znaki występujące najczęściej dostają najkrótsze kody, co sumarycznie daje świetne wyniki kompresji.

- **Złożoność czasowa:**
  - **Budowanie drzewa:** $O(N \log N)$ lub $O(N^2)$ w zależności od liczby unikalnych znaków (wynika to z sortowania listy węzłów w pętli `while`).
  - **Kodowanie i Dekodowanie:** $O(M)$, gdzie $M$ to długość przetwarzanego tekstu logów (przechodzenie sekwencyjne po znakach lub bitach).
- **Kiedy algorytm kończy działanie (Stop):** Etap budowania drzewa kończy się, gdy na liście węzłów zostanie tylko jeden element (korzeń). Proces dekodowania stopuje się po przeanalizowaniu wszystkich bitów ze skompresowanego ciągu wejściowego.

#### Kroki algorytmu w kodzie:
1. **Zliczanie częstotliwości i inicjalizacja (`BuildTree`):** Najpierw zliczamy słownikiem `Dictionary<char, int>`, ile razy dany znak pojawia się w logach, i na tej podstawie tworzymy listę liści drzewa. Dodaliśmy też zabezpieczenie: jeśli log składa się z tylko jednego unikalnego znaku, dorzucamy sztuczny węzeł `\0`, żeby struktura drzewa binarnego w ogóle mogła powstać.
2. **Budowanie drzewa binarnego:** W pętli `while` sortujemy węzły po częstotliwości, wyciągamy dwa najrzadsze elementy i łączymy je w nowy węzeł-rodzic, którego waga jest sumą ich wystąpień. Powtarzamy to, aż zostanie nam jeden główny korzeń (`root`).
3. **Generowanie słownika kodów (`GenerateDictionary`):** Przechodzimy rekurencyjnie gotowe drzewo od korzenia do liści. Idąc w lewo dopisujemy do kodu `"0"`, a idąc w prawo `"1"`. Gdy trafimy na liść, zapisujemy wygenerowany ciąg binarny do słownika pod odpowiednim znakiem.
4. **Kodowanie i Dekodowanie (`Encode` / `Decode`):** - `Encode` po prostu mapuje każdy znak z pliku logów na bity ze słownika i łączy je w jeden długi string.
   - `Decode` czyta ciąg zer i jedynek i schodzi po drzewie (0 w lewo, 1 w prawo). Gdy dotrze do liścia, przepisuje odkodowany znak do wyniku i wraca na samą górę drzewa, żeby procesować kolejne bity logu.

Implementacja algorytmu znajduje się w **src/backend/krasnoludki/Algorithms/HuffmanSolver.cs**

### 5. Wyszukiwanie krasnoludów w logach
Do szybkiego odnajdywania imion krasnali (np. "Gimli", "Thorin", "Balin") użyliśmy algorytmu **Aho-Corasick**. Działa on jak drzewo prefiksowe wyposażone w system "skrótów" awaryjnych. Pozwala na jednoczesne znalezienie **wielu imion** podczas zaledwie jednego przejścia przez cały tekst. Dzięki temu czas przeszukiwania kroniki nie rośnie, nawet jeśli na liście do odnalezienia mamy tysiące krasnoludzkich imion.

---

- **Złożoność:** 
  - **Budowa:** $O(M)$, gdzie $M$ to łączna długość wszystkich poszukiwanych imion.
  - **Wyszukiwanie:** $O(N + K)$, gdzie $N$ to długość analizowanego tekstu, a $K$ to łączna liczba wykrytych imion.
- **Kiedy algorytm kończy działanie (Stop):** Po przeczytaniu ostatniego znaku tekstu. Zwraca słownik z odnalezionymi imionami oraz listami pozycji (indeksów startowych), na których się pojawiły.

---

#### Kroki algorytmu w kodzie:
1. **Struktura węzła (`AhoCorasickNode`):** Każdy węzeł reprezentuje pojedynczą literę, przechowuje przejścia do kolejnych znaków (`Children`), listę dopasowanych imion (`Outputs`) oraz link awaryjny (`Fail`).
2. **Budowa drzewa (Trie):** W metodzie `BuildAutomaton` algorytm buduje standardowe drzewo z poszukiwanych imion. Na końcu każdego imienia dopisuje je do listy `Outputs` danego węzła jako potwierdzenie pełnego dopasowania.
3. **Tworzenie linków awaryjnych (`Fail Links`):** Przechodząc drzewo wszerz (kolejką BFS), algorytm konfiguruje wskaźniki `Fail`. Jeśli podczas czytania tekstu ścieżka się urwie, wskaźnik ten pozwala natychmiast przeskoczyć do analizy innego imienia (cofając się pętlą `while`), bez ponownego czytania tych samych liter. Węzły dziedziczą też listy `Outputs` od swoich linków awaryjnych, aby wykrywać imiona ukryte wewnątrz innych fraz.
4. **Wyszukiwanie (`Search`):** Algorytm czyta tekst znak po znaku. Przechodzi między węzłami, a w przypadku braku pasującej litery, cofa się po linkach `Fail`. Po każdym udanym ruchu sprawdza listę `Outputs` – jeśli nie jest pusta, oblicza pozycję startową imienia w tekście (`i - output.Length + 1`) i zapisuje ją do słownika wyników.

Implementacja algorytmu znajduje się w **src/backend/krasnoludki/Algorithms/LogAnalyzerSolver.cs**

## Testy
Poprawność i niezawodność każdego z algorytmów jest przez nas sprawdzana w testach jednostkowych. w fazie developmentu testy są zintegrowane z projektem - uruchamiają się przy kazdym **docker compose up**  
### Framework
Do testów jednostkowych użyliśmy frameworku **Xunit**, który jest frameworkiem do testowania w języku C#.
Uruchomienie testów:
```
cd src/backend/krasnoludki.Tests
dotnet test
```
#### Co testujemy?
- **DbIntegrity.cs** : test spójności bazy danych. sprawdzamy czy dane znajdują się w bazie danych, czy żadna z tabel ani kluczowych kolumn nie jest wynulowana.
- **UnitTest1.cs** : testujemy algorytm numer 1 pod kątem przypadków granicznych oraz poprawności funkcji (np przypisania krasnoluda do kopalni w przypadku różnicy preferencji minerałów)
- **UnitTest2.cs** : testujemy algorytm numer 2
- **UnitTest3.cs** : testujemy algorytm numer 3
- **UnitTest4.cs** : testujemy algorytm numer 4
- **UnitTest5.cs** : testujemy algorytm numer 5

Przykładowe testy:
```c#
 [Fact]
        public void SolveAssignments_WhenValidDwarfAndValidDeposit_AssignDwarfToDeposit() 
        {
            //test przypisania krasnoluda do zloza
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: false, houseId: 100)
            {
                House=house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            var deposit = new Deposit(id: 50, mineralId: 1, capacity: 100, x: 10, y: 20);
            var dwarfs = new List<Dwarf> { dwarf };
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);
            Assert.NotNull(dwarf.Deposit);
            Assert.Equal(50, dwarf.Deposit.Id);
        }
```
## Frontend
Frontend (wizualizacja) naszego projektu bazuje na technologiach takich jak html,css i javascript oraz formaty takie jak svg czy json. Dzięki tym technologiom korzystanie z naszego programu jest łatwiejsze i user-friendly.
Aby skorzystać z funkcjonalności naszego frontendu wystarczy włączyć projekt (aby działał w tle) a następnie odwiedzić stronę **localhost:3000**.
### Pogląd

#### Główny interfejs
<img width="1903" height="959" alt="image" src="https://github.com/user-attachments/assets/3351f496-6143-42d5-98ad-3a51b1a8519b" />

#### Edytor zestawów danych
<img width="1872" height="947" alt="image" src="https://github.com/user-attachments/assets/1727047f-bd64-4de7-948b-997d42afface" />

#### Wynik algorytmu
<img width="1895" height="956" alt="image" src="https://github.com/user-attachments/assets/3cd3ed4a-306f-4572-a394-2e892a9f7a8f" />

### Opcje

Nasza strona:
- zawiera gotowe zestawy danych do odpalenia algorytmu
- pozwala na tworzenie/usuwanie/edytowanie wlasnych z przyjemnym interfejsem graficznym
- uruchomienie algorytmów 1, 2, 3 oraz możliwosc pobrania logów (również tych skompresowanych [algorytm 4]) oraz mini program do dekompresowania, a także możliwość przeszukiwania logów pod względem nazw krasnoludów (algorytm 5)

### Generowanie danych
w fazie developmentu generowanie danych odbywa sie poprzez reczne wejscie do kontenera po uruchomieniu projektu.
```
docker compose up
docker exec -it generator_skrypt python generate.py
```
Następnie zostaniemy zapytani o wprowadzenie parametrow ktore chcemy wygenerowac dla danych.

## Baza danych 
Dzięki dockerowi obydwa kontenery (backend i db) są w tej samej sieci z automatu, więc nie trzeba się gimnastykować aby się połączyć.
Połączenie odbywa się za pomocą funkcji DbConnect. Fragment kodu: 
```c#
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();

            var DynamicParameters = new DynamicParameters();
            DynamicParameters.Add("p", Deposit.Id);

            const string Command = "SELECT mineral_id FROM Deposits WHERE id = @p";
            int Result = await Conn.QueryFirstOrDefaultAsync<int>(Command, DynamicParameters);
            return Result;
```
Przy każdym połączeniu robimy parametryzację aby chronić się przed SQL injection.
**Uwaga techniczna:** Dane pobierane z bazy danych zależą od stanu globalnej zmiennej actual_dataset. Aby pobrać dane z innego zbioru danych należy zmienić zawartośc tej zmiennej na nazwę zbioru.
### Zbiory (PostgreSQL schemas)
Aby rozwiązać problem różnych zbiorów danych bez tworzenia nowej bazy danych wykorzystaliśmy feature postgresa - czyli schematy.
Fragment struktury plików kontenera db:
- 01-init.sql 

**init.sql** zawiera tworzenie schematów, a datasety zawierają samo tworzenie danych i ich insertowanie.
**Uwaga techniczna:** Przy zmianie zawartości plików **.sql** zaleca się
1. docker compose down -v
2. docker compose up

to be continued...
Jakub Jabłoński, Kamil Hys, Miłosz Puchalski, Irek Polak.
