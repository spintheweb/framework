// MongoDB sample_mflix database initialization
// Creates sample movie data similar to the MongoDB Atlas sample dataset

// Switch to the sample_mflix database
db = db.getSiblingDB('sample_mflix');

// Create movies collection with sample data
db.movies.insertMany([
  {
    "_id": ObjectId("573a1390f29313caabcd4135"),
    "plot": "A group of bandits stage a brazen train hold-up, only to find a determined posse hot on their heels.",
    "genres": ["Short", "Western"],
    "runtime": 11,
    "cast": ["A.C. Abadie", "Gilbert M. 'Broncho Billy' Anderson", "George Barnes", "Justus D. Barnes"],
    "poster": "https://m.media-amazon.com/images/M/MV5BMTU3NjE5NzYtYTYyNS00MDVmLWIwYjgtMmYwYWIxZDYyNzU2XkEyXkFqcGdeQXVyNzQzNzQxNzI@._V1_SY1000_CR0,0,677,1000_AL_.jpg",
    "title": "The Great Train Robbery",
    "fullplot": "Among the earliest existing films in American cinema - notable as the first film that presented a narrative story to tell - it depicts a group of cowboy outlaws who hold up a train and rob the passengers. They are then pursued by a Sheriff's posse. Several scenes have color included - all hand tinted.",
    "languages": ["English"],
    "released": new Date("1903-12-01T00:00:00.000Z"),
    "directors": ["Edwin S. Porter"],
    "rated": "TV-G",
    "awards": {
      "wins": 1,
      "nominations": 0,
      "text": "1 win."
    },
    "lastupdated": "2015-08-13 00:27:59.177000000",
    "year": 1903,
    "imdb": {
      "rating": 7.4,
      "votes": 9847,
      "id": 439
    },
    "countries": ["USA"],
    "type": "movie",
    "tomatoes": {
      "viewer": {
        "rating": 3.7,
        "numReviews": 2559,
        "meter": 75
      },
      "fresh": 6,
      "critic": {
        "rating": 7.6,
        "numReviews": 6,
        "meter": 100
      },
      "rotten": 0,
      "lastUpdated": new Date("2015-08-08T19:16:10.000Z")
    }
  },
  {
    "_id": ObjectId("573a1390f29313caabcd42e8"),
    "plot": "A filmmaker recalls his childhood, when he fell in love with the movies at his village's theater and formed a deep friendship with the theater's projectionist.",
    "genres": ["Drama", "Romance"],
    "runtime": 155,
    "cast": ["Antonella Attili", "Enzo Cannavale", "Isa Danieli", "Leo Gullotta"],
    "poster": "https://m.media-amazon.com/images/M/MV5BM2FhYjEyYmYtMDI1Yy00YTdlLWI2NWQtYmEzNzAxOGY1NjY2XkEyXkFqcGdeQXVyNTA3NTIyNDg@._V1_SY1000_CR0,0,686,1000_AL_.jpg",
    "title": "Cinema Paradiso",
    "fullplot": "A filmmaker recalls his childhood when he and his young friends first discovered love for the cinema while watching films at their village theater. In a flashback, we are taken to the immediate post-WWII years, when hate and resentment ruled the country. It was during those troubled times that young Salvatore was initiated into projectionist Alfredo's trade, and this love for the silver screen opened a whole new world for him.",
    "languages": ["Italian"],
    "released": new Date("1990-02-23T00:00:00.000Z"),
    "directors": ["Giuseppe Tornatore"],
    "rated": "R",
    "awards": {
      "wins": 12,
      "nominations": 4,
      "text": "Won 1 Oscar. Another 11 wins & 4 nominations."
    },
    "lastupdated": "2015-09-15 17:46:46.660000000",
    "year": 1988,
    "imdb": {
      "rating": 8.5,
      "votes": 202778,
      "id": 095765
    },
    "countries": ["Italy", "France"],
    "type": "movie",
    "tomatoes": {
      "website": "http://www.miramax.com/movie/cinema-paradiso",
      "viewer": {
        "rating": 4.3,
        "numReviews": 32072,
        "meter": 94
      },
      "dvd": new Date("2003-08-19T00:00:00.000Z"),
      "critic": {
        "rating": 8.0,
        "numReviews": 30,
        "meter": 90
      },
      "lastUpdated": new Date("2015-09-12T17:48:21.000Z"),
      "consensus": "Sentimental and beautiful, Cinema Paradiso uses its protagonist's love of film as the starting point for a larger meditation on life, death, and the passage of time.",
      "rotten": 3,
      "production": "Miramax Films",
      "fresh": 27
    },
    "num_mflix_comments": 3
  },
  {
    "_id": ObjectId("573a1399f29313caabcdc593"),
    "plot": "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory during World War II.",
    "genres": ["Biography", "Drama", "History"],
    "runtime": 195,
    "cast": ["Liam Neeson", "Ben Kingsley", "Ralph Fiennes", "Caroline Goodall"],
    "poster": "https://m.media-amazon.com/images/M/MV5BNDE4OTMxMTctNmRhYy00NWE2LTg3YzItYTk3M2UwOTU5Njg4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SY1000_CR0,0,666,1000_AL_.jpg",
    "title": "Schindler's List",
    "fullplot": "Oskar Schindler is a vainglorious and greedy German businessman who becomes an unlikely humanitarian amid the barbaric German Nazi reign when he feels compelled to turn his factory into a refuge for Jews. Based on the true story of Oskar Schindler who managed to save about 1100 Jews from being gassed at the Auschwitz concentration camp, it is a testament to the good in all of us.",
    "languages": ["English", "Hebrew", "German", "Polish"],
    "released": new Date("1994-02-04T00:00:00.000Z"),
    "directors": ["Steven Spielberg"],
    "rated": "R",
    "awards": {
      "wins": 95,
      "nominations": 49,
      "text": "Won 7 Oscars. Another 88 wins & 49 nominations."
    },
    "lastupdated": "2015-09-04 00:22:54.600000000",
    "year": 1993,
    "imdb": {
      "rating": 8.9,
      "votes": 1029945,
      "id": 108052
    },
    "countries": ["USA"],
    "type": "movie",
    "tomatoes": {
      "website": "http://www.uphe.com/movies/schindlers-list",
      "viewer": {
        "rating": 4.5,
        "numReviews": 150310,
        "meter": 97
      },
      "dvd": new Date("2004-03-09T00:00:00.000Z"),
      "critic": {
        "rating": 9.0,
        "numReviews": 81,
        "meter": 97
      },
      "lastUpdated": new Date("2015-09-04T18:45:58.000Z"),
      "consensus": "A touching masterpiece, Schindler's List is essential viewing for fans of cinema in general.",
      "rotten": 2,
      "production": "Universal Pictures",
      "fresh": 79
    },
    "num_mflix_comments": 10
  }
]);

// Create users collection with sample data
db.users.insertMany([
  {
    "_id": ObjectId("59b99db4cfa9a34dcd7885b6"),
    "name": "Ned Stark",
    "email": "sean_bean@gameofthron.es",
    "password": "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vy"
  },
  {
    "_id": ObjectId("59b99db4cfa9a34dcd7885b7"),
    "name": "Jon Snow",
    "email": "kit_harington@gameofthron.es",
    "password": "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vy"
  },
  {
    "_id": ObjectId("59b99db4cfa9a34dcd7885b8"),
    "name": "Arya Stark",
    "email": "maisie_williams@gameofthron.es",
    "password": "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vy"
  }
]);

// Create comments collection with sample data
db.comments.insertMany([
  {
    "_id": ObjectId("5a9427648b0beebeb69579cc"),
    "name": "Andrea Le",
    "email": "andrea_le@fakegmail.com",
    "movie_id": ObjectId("573a1399f29313caabcdc593"),
    "text": "Rem officiis eaque repellendus amet eos doloribus. Porro dolor voluptatum voluptates neque culpa molestias. Voluptate unde nulla temporibus ullam.",
    "date": new Date("2002-08-18T04:56:07.000Z")
  },
  {
    "_id": ObjectId("5a9427648b0beebeb69579cd"),
    "name": "Mercedes Tyler",
    "email": "mercedes_tyler@fakegmail.com",
    "movie_id": ObjectId("573a1390f29313caabcd42e8"),
    "text": "Eius veritatis vero facilis quaerat fuga temporibus. Praesentium expedita sequi repellat voluptatem veniam voluptatem.",
    "date": new Date("2011-08-02T00:46:36.000Z")
  }
]);

// Create indexes for better performance
db.movies.createIndex({ "title": 1 });
db.movies.createIndex({ "genres": 1 });
db.movies.createIndex({ "year": 1 });
db.movies.createIndex({ "imdb.rating": 1 });

db.users.createIndex({ "email": 1 }, { unique: true });

db.comments.createIndex({ "movie_id": 1 });
db.comments.createIndex({ "date": 1 });

print("MongoDB sample_mflix database initialized successfully!");