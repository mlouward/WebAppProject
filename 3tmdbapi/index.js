const submitAnswerButton = document.getElementById('submit-button');
const answerField = document.getElementById(`input1`);
const API_KEY = "b6b0c5da479c996f45abfa80ab960607";
const movieInfos = document.getElementById('movie-infos1');
const questionLabel = document.getElementById('question');

document.addEventListener("DOMContentLoaded", loadFirstMovie)

function loadFirstMovie() {
  // search query with tmdb API for initial movie SkyFall
  fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=Skyfall&page=1&include_adult=false`)
    .then((response) => {
      if (response.status != 200) {
        throw new Error("Error " + response.status);
      }
      return response.json();
    })
    .then((txt) => {
      // Get first element of the list and use infos to display title, date, image
      const movie = txt.results[0];

      const infos = document.createElement('h3');
      infos.innerHTML = `Title: ${movie.original_title}, released: ${movie.release_date}`;
      infos.classList.add('movie-title');

      const poster = document.createElement('img');
      poster.src = `https://image.tmdb.org/t/p/w400${movie.poster_path}`;

      movieInfos.appendChild(infos);
      movieInfos.appendChild(poster);
      // save the movie ID to check if the acotr/director is correct later
      sessionStorage.setItem('movieID1', movie.id);
    });
  checkActorDirector(1);
  //checkMovie(2);
}

function checkActorDirector(answerNb) {
  questionLabel.innerHTML = "Name a director/actor of this movie";
  // Set event listener for submit button
  submitAnswerButton.addEventListener('click', _ => {
    // case insensitive result
    const answer = answerField.value.toLowerCase();
    console.log(answer);
    // get last movie ID from sessionStorage
    const movie_id = sessionStorage.getItem(`movieID${answerNb}`)
    checkAnswerActorDirector(answer, movie_id).then(result => {
      console.log(result);
      [rightAnswer, full_name, poster] = result;
      // display message / actor infos if the answer is false / true
      if (rightAnswer)
        correctActorDirector(answerNb + 1, full_name, poster);
      else
        wrongAnswer()
    })
  });
}

function checkMovie(answerNb) {
  // Save actor/director answer then clear answer box
  const person = answerField.value;
  answerField.value = "";
  // Update question
  questionLabel.innerHTML = `Name a movie where ${capitalize(person)} is the actor/director`;
  submitAnswerButton.addEventListener('click', _ => {
    // get answer from textbox
    const answer = answerField.value.toLowerCase();
    console.log(answer);
    // Check if the answer is right (movie contains actor/director given as answer)
    checkAnswerMovie(answer).then(result => {
      console.log(result);
      [rightAnswer, full_name, poster] = result;
      if (rightAnswer === true)
        correctActorDirector(answerNb + 1, full_name, poster);
      else
        wrongAnswer()
    })
  });
}

// Checks cast of a movie_id
async function checkAnswerActorDirector(answer, movie_id) {
  const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}/credits?api_key=b6b0c5da479c996f45abfa80ab960607&language=en-US`);
  if (response.status != 200) {
    throw new Error("Error " + response.status);
  }
  const result_1 = await response.json();
  for (const person of result_1.cast) {
    if (person.name.toLowerCase() === answer && person.known_for_department == "Acting") {
      sessionStorage.setItem('personID1', person.id);
      return [true, person.original_name, person.profile_path];
    }
  };
  for (const person of result_1.crew) {
    if (person.name.toLowerCase() === answer && person.known_for_department == "Directing") {
      sessionStorage.setItem('personID1', person.id);
      return [true, person.original_name, person.profile_path];
    }
  };
  return [false, "", ""];
}

// Checks movies of a personID 
async function checkAnswerMovie(answer) {
  const person_id = sessionStorage.getItem('personID1');
  const movie_response = await fetch(`https://api.themoviedb.org/3/person/${person_id}/movie_credits?api_key=${API_KEY}&language=en-US`);
  if (movie_response.status != 200) {
    throw new Error("Error " + movie_response.status);
  }
  const result_1 = await movie_response.json();
  console.log(result_1);
  for (const movie of result_1.cast) {
    if (movie.original_title.toLowerCase() === answer) {
      sessionStorage.setItem('movieID1', movie.id); // ?
      return [true, movie.original_title, movie.poster_path];
    }
  };
  for (const movie of result_1.crew) {
    if (movie.original_title.toLowerCase() === answer) {
      sessionStorage.setItem('movieID1', movie.id); // ?
      return [true, movie.original_title, movie.poster_path];
    }
  };
  return [false, "", ""];
}

function correctActorDirector(answerNb, full_name, poster_path) {
  // Remove "wrong answer" text if right answer
  try {
    const wrongText = document.getElementById('wrong-answer');
    wrongText.remove();
  } catch (error) {
    console.log("no wrong answer");
  }
  // Add new div with actor/director infos
  const actor_div = document.createElement('div');

  const infos = document.createElement('h3');
  infos.innerHTML = `Name: ${full_name}`;
  infos.classList.add('actor-name');

  const poster = document.createElement('img');
  poster.src = `https://image.tmdb.org/t/p/w400${poster_path}`;

  actor_div.appendChild(infos);
  actor_div.appendChild(poster);

  movieInfos.appendChild(actor_div);
}

function wrongAnswer() {
  // Check if already wrong answer, then remove text and re-add it after
  for (const node of movieInfos.childNodes) {
    if (node.id === "wrong-answer") {
      node.remove();
      break;
    }
  }

  const infos = document.createElement('p');

  infos.id = "wrong-answer"
  infos.style = "color: red; text-align: center;"
  infos.innerHTML = "Sorry, this is not a right answer."

  movieInfos.appendChild(infos);
}

function capitalize(string) {
  return string.split(' ').map((word) => {
    return word[0].toUpperCase() + word.substring(1);
  }).join(" ");
}