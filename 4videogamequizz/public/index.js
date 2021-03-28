const signin = document.getElementById('signin-button')
const login = document.getElementById('login-button')


// Custom POST handler instead of form to handle errors and display an alert 
signin.addEventListener('click', async _ => {
  const uname = document.getElementById('suname').value;
  const pwd = document.getElementById('spwd').value;
  console.log(JSON.stringify({ uname, pwd }));
  const res = await fetch('/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uname, pwd })
  });
  if (res.status === 422) {
    const response = await res.json();
    alert(response.error);
  }
});

login.addEventListener('click', async _ => {
  const uname = document.getElementById('luname').value;
  const pwd = document.getElementById('lpwd').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uname, pwd })
  });
  console.log(res.status);
  if ([422, 401].includes(res.status)) {
    const response = await res.json();
    alert(response.error);
  }
})