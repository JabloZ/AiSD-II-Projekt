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
];
