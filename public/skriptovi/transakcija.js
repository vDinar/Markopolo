function r(f){
  /in/.test(document.readyState) ? setTimeout('r(' + f + ')', 9) : f();
}

function getTransaction()
{
  if(window.XMLHttpRequest)
  {
    xhttp = new XMLHttpRequest();
  }
  else
  {
    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xhttp.onreadystatechange = function()
  {
    if(this.readyState == 4 && this.status == 200)
    {
      const result = JSON.parse(this.responseText);

      const id = result.pozicija;
      const value = result.vrijednost;
      const block = result.blok;
      var date = new Date(result.datum * 1000);
      date = date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + " " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
      const inputs = result.ulazi;
      const outputs = result.izlazi;

      document.getElementById("transactionId").innerHTML = id;
      document.getElementById("transactionValue").innerHTML = value;
      document.getElementById("transactionBlock").innerHTML = "\
        <a href=\"/blok/" + block + "\">\
          " + block + "\
        </a>\
      ";
      document.getElementById("transactionTime").innerHTML = date;

      for(var i = 0; i < inputs.length; i++)
      {
        document.getElementById("transactionInputs").innerHTML += "\
            <div class='inputs-tr inputs-tr--values" + (inputs[i].temeljni ? " inputs-tr--coinbase" : "") + "'>\
              <div class='inputs-td'>\
                " + (inputs[i].temeljni ? "Novoproizvedeno" : ("<a href=\"/adresa/" + inputs[i].pošiljalac + "\">" + inputs[i].pošiljalac + "</a>")) + "\
              </div>\
              <div class='inputs-td'>\
                " + inputs[i].vrijednost + " VDN\
              </div>\
            </div>\
          ";
      }

      for(var i = 0; i < outputs.length; i++)
      {
        document.getElementById("transactionOutputs").innerHTML += "\
            <div class='outputs-tr outputs-tr--values'>\
              <div class='outputs-td'>\
                " + "<a href=\"/adresa/" + outputs[i].primalac + "\">" + outputs[i].primalac + "</a>\
              </div>\
              <div class='outputs-td'>\
                " + outputs[i].vrijednost + " VDN\
              </div>\
            </div>\
          ";
      }
    }
  };

  xhttp.open("GET", "/aps/v1.0/transakcija?identifikator=" + document.getElementById("transaction").innerHTML, true);
  xhttp.send();
}

r(function()
  {
    getTransaction();
  });
