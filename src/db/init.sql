--jak zmieniasz tu cos to walnij compose down i compose up, bo narazie nie obslugujemy migracji baz danych i to jest tylko do testowania

CREATE TABLE Dwarfs(
    id INT PRIMARY KEY,
    name VARCHAR(50),
    volume INT,
    depositAssigned BOOLEAN
);

INSERT INTO Dwarfs VALUES (1,'Kamin',70,false);
INSERT INTO Dwarfs VALUES (2,'Zorak',30,false);