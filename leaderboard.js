async function loadLeaderboard() {

  const res = await fetch("/api/quiz/leaderboard");
  const data = await res.json();

  const body = document.getElementById("leaderboardBody");

  body.innerHTML = "";

  data.forEach((player,index)=>{

    let className = "";

    if(index === 0) className = "rank1";
    if(index === 1) className = "rank2";
    if(index === 2) className = "rank3";

    let medal = "";

    if(index === 0) medal = "🥇";
    else if(index === 1) medal = "🥈";
    else if(index === 2) medal = "🥉";
    else medal = index + 1;

    body.innerHTML += `
      <tr class="${className}">
        <td>${medal}</td>
        <td>${player.username}</td>
        <td>${player.score}/${player.total}</td>
        <td>${player.time_taken}s</td>
      </tr>
    `;
  });
}

loadLeaderboard();