function r(f){
  /in/.test(document.readyState) ? setTimeout('r(' + f + ')', 9) : f();
}

function getBlock()
{
  var xhttp;

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

      const height = result.pozicija;
      var date = new Date(result.datum * 1000);
      date = date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + " " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
      const merkleRoot = result.rezultatTransakcija;
      const confirmations = result.potvrde;
      const difficulty = result.težina;

      document.getElementById("blockHeight").innerHTML = height;
      document.getElementById("blockTime").innerHTML = date;
      document.getElementById("blockMerkle").innerHTML = merkleRoot;
      document.getElementById("blockConfirmations").innerHTML = confirmations;
      document.getElementById("blockDifficulty").innerHTML = difficulty;

      if(height > 0)
      {
        for(var i = 0; i < result.transakcije.length; i++)
        {
          document.getElementById("blockTransactions").innerHTML += "\
            <div class=\"block-tr block-tr--values\">\
              <div class=\"block-td\">\
                " + (i + 1) + "\
              </div>\
              <div class=\"block-td\">\
                <a href=\"/transakcija/" + result.transakcije[i] + "\">\
                  " + result.transakcije[i] + "\
                </a>\
              </div>\
              <div class=\"block-td " + ((i <= 1) ? "affirmative" : "negative") + "\">\
                " + ((i <= 1) ? "Da" : "Ne") + "\
              </div>\
              <div class=\"block-td negative\">\
                Ne\
              </div>\
            </div>\
          ";
        }
      }
      else
      {
        for(var i = 0; i < result.transakcije.length; i++)
        {
          document.getElementById("blockTransactions").innerHTML += "\
            <div class=\"block-tr block-tr--values\">\
              <div class=\"block-td\">\
                " + (i + 1) + "\
              </div>\
              <div class=\"block-td\">\
                " + result.transakcije[i] + "\
              </div>\
              <div class=\"block-td affirmative\">\
                Da\
              </div>\
              <div class=\"block-td affirmative\">\
                Da\
              </div>\
            </div>\
          ";
        }
      }
    }
  };

  xhttp.open("GET", "/aps/v1.0/blokputemrezultata?rezultat=" + document.getElementById("block").innerHTML, true);
  xhttp.send();
}

r(function()
  {
    getBlock();
  });
