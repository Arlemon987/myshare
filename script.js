async function uploadFile() {

  const file =
    document.getElementById("file").files[0];

  if(!file){
    alert("Select file");
    return;
  }

  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if(data.link){

    document.getElementById("result")
    .innerHTML = `
      <p>Share Link:</p>

      <a href="${data.link}" target="_blank">
        ${data.link}
      </a>
    `;
  }
}
