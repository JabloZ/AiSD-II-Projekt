export const ALGORITHMS = [
    {
        id: 'hungarian',
        name: 'Algorytm Węgierski',
        shortName: 'Węgierski',
        complexity: 'O(n³)',
        spaceComplexity: 'O(n²)',
        description: 'Algorytm optymalnego przydziału zasobów w grafach dwudzielnych. Gwarantuje minimalizację łącznego kosztu przydziału krasnoludków do kopalni.',
        steps: [
            'Zbuduj macierz kosztów (dystans każdego krasnoludka do każdej kopalni)',
            'Odejmij minimum każdego wiersza od wszystkich elementów w tym wierszu',
            'Odejmij minimum każdej kolumny od wszystkich elementów w tej kolumnie',
            'Wyznacz minimalne pokrycie linii zerujące wszystkie zera w macierzy',
            'Jeśli liczba linii = n → wyznacz optymalny przydział z zer i zakończ',
            'W przeciwnym razie: zmodyfikuj macierz (odejmij minimum z niepokrytych, dodaj do podwójnie pokrytych) i wróć do kroku 4',
        ],
    },
    {
        id: 'greedy',
        name: 'Algorytm Zachłanny',
        shortName: 'Zachłanny',
        complexity: 'O(n² log n)',
        spaceComplexity: 'O(n)',
        description: 'Heurystyczny algorytm zachłanny. Szybki, ale nie gwarantuje optymalnego rozwiązania – w każdym kroku wybiera lokalnie najtańszy wolny przydział.',
        steps: [
            'Wylicz koszt (dystans) dla każdej możliwej pary (krasnoludek, kopalnia)',
            'Posortuj wszystkie pary rosnąco według kosztu',
            'Dla każdej pary od najtańszej: jeśli krasnoludek i kopalnia są wolni – przydziel',
            'Powtarzaj dopóki wszyscy krasnoludkowie są przydzieleni lub lista jest wyczerpana',
        ],
    },
    {
        id: 'random',
        name: 'Algorytm Losowy',
        shortName: 'Losowy',
        complexity: 'O(n)',
        spaceComplexity: 'O(n)',
        description: 'Losowy przydział krasnoludków do dostępnych kopalni. Nie optymalizuje kosztu – służy jako baseline do porównania z innymi algorytmami.',
        steps: [
            'Przetasuj listę kopalni w losowej kolejności (Fisher-Yates)',
            'Przydziel każdemu krasnoludkowi kolejną kopalnię z przetasowanej listy',
        ],
    },
];
