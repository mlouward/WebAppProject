const signin = document.getElementById('signin-button')

signin.addEventListener('click', async _ => {
  const uname = document.getElementById('suname').value;
  const pwd = document.getElementById('spwd').value;
  console.log(uname, pwd);
  const res = await fetch('/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uname, pwd })
  });
  const response = await res.json();
  if (res.status === 422) {
    alert(response.error);
  }
});