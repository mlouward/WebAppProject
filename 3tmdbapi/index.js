const submitAnswerButton = document.getElementById('submit-button');
const answerField = document.getElementById(`input1`);
const API_KEY = "b6b0c5da479c996f45abfa80ab960607";
const INITIAL_MOVIE = 37724
const movieInfos = document.getElementById('movie-infos1');
const questionLabel = document.getElementById('question');
let alreadyGuessedMovies = [];
let questionNb = 0;
let gameRunning = true;

// Initial call to the function with default movie when page is loaded
document.addEventListener("DOMContentLoaded", loadMovie(INITIAL_MOVIE));

async function loadMovie(movie_id) {
  // search query with tmdb API for initial movie SkyFall
  answerField.value = ""
  await fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${API_KEY}&language=en-US`)
    .then((response) => {
      if (response.status != 200) {
        throw new Error("Error " + response.status);
      }
      return response.json();
    })
    .then((movie) => {
      // increment questionNb
      questionNb++;

      showMovieInfos(movie);

      checkActorDirector();
    });
}

function showMovieInfos(movie) {
  const infos = document.createElement('h3');
  infos.innerHTML = `Title: ${movie.original_title}, released: ${movie.release_date}`;
  infos.classList.add('movie-title');

  const poster = document.createElement('img');
  poster.src = `https://image.tmdb.org/t/p/w400${movie.poster_path}`;

  movieInfos.appendChild(infos);
  movieInfos.appendChild(poster);
  // save the movie ID to check if the actor/director is correct later
  sessionStorage.setItem('movieID1', movie.id);
}

function showActorInfos(full_name, poster_path) {
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

async function checkActorDirector() {
  questionLabel.innerHTML = "Name a director/actor of this movie";
  // Set event listener for submit button
  submitAnswerButton.addEventListener('click', submitAnswerButton.ad = async function () {
    // case insensitive result
    const answer = answerField.value.toLowerCase();
    console.log(answer);
    // get last movie ID from sessionStorage
    const movie_id = sessionStorage.getItem(`movieID1`);
    await checkAnswerActorDirector(answer, movie_id).then(result => {
      [rightAnswer, full_name, poster] = result;
      console.log(rightAnswer);
      // display message / actor infos if the answer is false / true
      if (rightAnswer)
        correctActorDirector(full_name, poster);
      else
        wrongAnswer()
    })
  });
}

async function checkAnswerActorDirector(answer, movie_id) {
  // Checks cast of a movie_id
  const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}/credits?api_key=${API_KEY}&language=en-US`);
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

async function checkMovie() {
  // Save actor/director answer then clear answer box
  const person = answerField.value;
  answerField.value = "";
  // Update question
  questionLabel.innerHTML = `Name a movie where ${capitalize(person)} is the actor/director`;
  submitAnswerButton.addEventListener('click', submitAnswerButton.m = async function () {
    // get answer from textbox
    const answer = answerField.value.toLowerCase();
    // Check if the answer is right (movie contains actor/director given as answer)
    await checkAnswerMovie(answer).then(result => {
      console.log(result);
      if (alreadyGuessedMovies.includes(sessionStorage.getItem('movieID1')) || !result)
        wrongAnswer()
      else
        correctMovie();
    })
  });
}

async function checkAnswerMovie(answer) {
  // Checks movies of a personID 
  const person_id = sessionStorage.getItem('personID1');
  console.log(person_id);
  const movie_response = await fetch(`https://api.themoviedb.org/3/person/${person_id}/movie_credits?api_key=${API_KEY}&language=en-US`);
  if (movie_response.status != 200) {
    throw new Error("Error " + movie_response.status);
  }
  const result_1 = await movie_response.json();
  for (const movie of result_1.cast) {
    if (movie.original_title.toLowerCase() === answer) {
      sessionStorage.setItem('movieID1', movie.id);
      return true;
    }
  };
  for (const movie of result_1.crew) {
    if (movie.original_title.toLowerCase() === answer) {
      sessionStorage.setItem('movieID1', movie.id);
      return true;
    }
  };
  return false;
}

function correctActorDirector(full_name, poster_path) {
  questionNb++;
  // Remove "wrong answer" text if right answer
  for (const node of movieInfos.childNodes) {
    if (node.id === "wrong-answer") {
      node.remove();
      break;
    }
  }
  submitAnswerButton.removeEventListener("click", submitAnswerButton.ad);

  // Add new div with actor/director infos
  showActorInfos(full_name, poster_path);

  checkMovie()
}

function correctMovie() {
  questionNb++;
  // Remove "wrong answer" text if right answer
  for (const node of movieInfos.childNodes) {
    if (node.id === "wrong-answer") {
      node.remove();
      break;
    }
  }
  // Add new div with actor/director infos
  const id = sessionStorage.getItem("movieID1");
  submitAnswerButton.removeEventListener("click", submitAnswerButton.m);
  alreadyGuessedMovies.push(id);
  loadMovie(id)
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
  infos.innerHTML = "Sorry, this is not a right answer, or you already guessed this movie."

  movieInfos.appendChild(infos);
}

function capitalize(string) {
  return string.split(' ').map((word) => {
    return word[0].toUpperCase() + word.substring(1);
  }).join(" ");
}