function emptyField() {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: "Fields cannot be empty",
  });
}

/* Likes Here */
function likeFunction(x, userId) {
  if (x.classList.contains("far")) {
    x.classList.remove("far");
    x.classList.add("fas");
    x.style.color = "#e71c1c";
    saveLikes(userId);
  } else if (x.classList.contains("fas")) {
    x.classList.remove("fas");
    x.classList.add("far");
    unLike(userId);
    x.style.color = "#006400";
  } else {
    x.classList.remove("fas");
    x.classList.add("far");
    unLike(userId);
  }
}

function saveLikes(ID) {
  //let count = $('.count')

  fetch(`/likes/${ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ userId: ID }),
  })
    .then((response) => response.json())
    .then((data) => (document.getElementById(ID + "Like").innerHTML = data));
  //window.location.href=window.location.href;
}

function unLike(ID) {
  fetch(`/unlike/${ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ userId: ID }),
  })
    .then((response) => response.json())
    .then((data) => (document.getElementById(ID + "Like").innerHTML = data));
  //window.location.href=window.location.href;
}
/* END Likes */

/* Submit post to show loading gif */
$("#submitPost").click(function () {
  $(".loading-animation").toggleClass("active");
});

$("#update-post").click(function () {
  $(".loading-animation").toggleClass("active");
});

/* Comments Here */
$("#formComment").submit(function (e) {
  e.preventDefault();
  const postID = $("#postID").val();

  postComment(postID);
  $("#likes-container").load(window.location.href + " #likes-container");
});

function postComment(ID) {
  let postID = ID;
  const comment = $("#comment").val();

  if (comment === "") {
    emptyField();
  } else {
    fetch(`/comment/${postID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: postID, comment: comment }),
    });

    window.location.href = window.location.href;
  }
}
/* Comments END Here */

/* Lozad */
const el = document.querySelector("img");
const observer = lozad(el); // passing a `NodeList` (e.g. `document.querySelectorAll()`) is also valid
observer.observe();

/* Post Action */
function showAction(data) {
  const modal = document.getElementById(data);

  $(modal).toggleClass("active");
}

function deletePost(data) {
  let postID = data;

  fetch("/delete", {
    method: "Post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postID: postID }),
  });

  window.location.replace("/index");
}
/* Post Action END */

/* Delete Comment Here */
function deleteComment(Id) {
  const commentId = Id;
  const url = "/deleteComment";

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commentId: commentId }),
  });
  $("#likes-container").load(window.location.href + " #likes-container");
  window.location.href = window.location.href;
}

/* Delete Comment END Here */

/* EDIT */
$(".close-edit").click(function () {
  window.location.replace("/index");
});
