document.addEventListener("DOMContentLoaded", () => {
  const movieInfos = document.getElementById('movie-infos');
  fetch('https://api.themoviedb.org/3/search/movie?api_key=b6b0c5da479c996f45abfa80ab960607&language=en-US&query=Skyfall&page=1&include_adult=false')
    .then((response) => {
      if (response.status != 200) {
        throw new Error("Error " + response.status);
      }
      return response.text();
    })
    .then((txt) => {
      const text = JSON.parse(txt);
      console.log(text);
      const movie = text.results[0];

      const infos = document.createElement('h3');
      infos.innerHTML = `Title: ${movie.original_title}, released: ${movie.release_date}`;
      infos.classList.add('movie-title');

      const poster = document.createElement('img');
      poster.src = `https://image.tmdb.org/t/p/w400${movie.poster_path}`;

      movieInfos.appendChild(infos);
      movieInfos.appendChild(poster);
    });

})


// search.onclick = function () {
//   const query_string = encodeURIComponent(query.value.trim());
//   const URL = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${query_string}&api-key=seVkZHEef0VUe75NzQYWTpSuiprk7gjZ`;
//   article_section.innerHTML = "";
//   fetch(URL)
//     .then((response) => {
//       if (response.status != 200) {
//         throw new Error("Error " + response.status);
//       }
//       return response.text();
//     })
//     .then((text) => {
//       articles = JSON.parse(text).response.docs;
//       for (const article of articles) {
//         let node = document.createElement("div");
//         node.class = "article-box";

//         let header = document.createElement("h2");
//         header.innerHTML = article.headline.main;
//         node.appendChild(header);

//         let date = document.createElement("p");
//         date.innerHTML = article.pub_date.split("T")[0];
//         node.appendChild(date);

//         let image_txt = document.createElement("p");
//         let image = document.createElement("img");
//         image_txt.textContent = article.abstract;
//         image.src = IMG_URL + article.multimedia[0].url;
//         image_txt.prepend(image);
//         node.appendChild(image_txt);

//         article_section.appendChild(node);
//       }
//     });
// };
