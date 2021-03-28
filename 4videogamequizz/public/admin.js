function del_card(questionId) {
  console.log("deleting card", questionId);
  fetch('/questions', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: questionId })
  })
    .then(res => {
      if (res.ok) return res.json()
    })
    .then(response => {
      if (response === 'card deleted')
        window.location.reload()
      else
        console.log(`no card deleted (id: ${questionId}`);
    })
    .catch(console.error)
}