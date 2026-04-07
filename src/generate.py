import random

def gen_insert_dwarfs(number_of_dwarves, number_of_deposits,number_of_houses):
    dwarfs_names = ["Kamin", "Zarok", "Karoz","Zyczliwek","Wromeo","Julianka","Bankus", "Hohelka","Chlapibrzuch","Moczypieta", "Milostek",
                    "Ogorzalek", "Opilek", "Twardowski", "Plazus", "Giełdus", "Gilbert", "Pokerek", "Farciarz","Medrek", "Gburek", "Apsik", "Wesołek",
                    "Dwalin", "Balin", "Kili", "Bifur", "Thorin"
                    ]
    with open("dane.txt", "a", encoding="utf-8") as file:

        house_id = random.sample(range(1, number_of_houses + 1), number_of_houses)

        for id in range(number_of_dwarves):

            volumen = random.randint(1, 100)
            deposit_assigned_chance = random.randint(0, 100)

            if(deposit_assigned_chance > 20):
                deposit_assigned = "true"
                deposit_id = random.randint(1, number_of_deposits)
            else:
                deposit_assigned = "false"
                deposit_id = "NULL"

            file.write(f'INSERT INTO Dwarfs VALUES ({str(id+1)},\'{random.choice(dwarfs_names)}\',{volumen},{deposit_assigned},{house_id[id]},{deposit_id});\n')

def gen_insert_deposits(number_of_deposits,amount_of_minerals,map_x,map_y):

    with open("dane.txt", "a", encoding="utf-8") as file:
        for id in range(number_of_deposits):

            mineral_id = random.randint(1, amount_of_minerals)
            capacity = random.randint(1, 25)
            x = random.randint(0, map_x)
            y = random.randint(0, map_y)
            file.write(f'INSERT INTO Deposits VALUES ({id+1},{mineral_id},{capacity},{x},{y});\n')

def gen_insert_map(map_x,mapy_y):
    with open("dane.txt", "a", encoding="utf-8") as file:
        file.write(f'INSERT INTO Map VALUES ({map_x},{mapy_y});\n')
def gen_insert_minerals(amount_of_minerals):
    names = ["Zloto", "Srebro","Miedz","Zelazo","Diament","Wegiel","Szmaragd"]#max 7 mineralow jest puki co
    names_random = random.sample(names, len(names))
    with open("dane.txt", "a", encoding="utf-8") as file:
        for id in range(amount_of_minerals):
            file.write(f'INSERT INTO Minerals VALUES ({id+1},\'{names_random[id]}\');\n')

def gen_insert_houses(number_of_houses,map_x,map_y):
    with open("dane.txt", "a", encoding="utf-8") as file:
        for id in range(number_of_houses):
            x = random.randint(0, map_x)
            y = random.randint(0, map_y)
            file.write(f'INSERT INTO House VALUES ({id + 1},{x},{y});\n')
def gen_insert_preferences(number_of_dwarves,amount_of_minerals):
    with open("dane.txt", "a", encoding="utf-8") as file:
        for id_dwrv in range(1, number_of_dwarves + 1):

            amount_of_data = random.randint(1, amount_of_minerals)
            selected_minerals = random.sample(range(1, amount_of_minerals + 1), amount_of_data)

            for id_minerl in selected_minerals:
                multiplier = round(random.uniform(0.1, 2.0), 2)

                file.write(f"INSERT INTO Preferences VALUES ({id_dwrv}, {id_minerl},{multiplier});\n")
open("dane.txt", "w", encoding="utf-8").close()

print("GENERATOR LOSOWYCH DANYCH DO BAZY DANYCH\n")
print("Zasady: \n")
print("1) Ilosc domow musi byc taka sama jak ilosc krasnali.\n")
print("2) Jest maksymalnie 7 rodzajow mineralow.\n")

number_of_dwarves = int(input("Podaj ilosc krasnali: "))
number_of_houses = int(input("Podaj ilosc domow: "))

if(number_of_dwarves != number_of_houses):
    print("Zle dane")
else:
    map_x = int(input("Podaj szerokosc mapy: "))
    map_y = int(input("Podaj wysokosc mapy: "))
    number_of_deposits = int(input("Podaj ilosc wyrobisk: "))

    amount_of_minerals = int(input("Podaj ilosc mineralow: "))
    if(amount_of_minerals>7):
        print("Zle dane")
    else:
        gen_insert_map(map_x, map_y)
        gen_insert_minerals(amount_of_minerals)
        gen_insert_houses(number_of_houses,map_x,map_y)
        gen_insert_deposits(number_of_deposits,amount_of_minerals,map_x,map_y)
        gen_insert_dwarfs(number_of_dwarves,number_of_deposits,number_of_houses)
        gen_insert_preferences(number_of_dwarves,amount_of_minerals)










