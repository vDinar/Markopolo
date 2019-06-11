function r(f){
  /in/.test(document.readyState) ? setTimeout('r(' + f + ')', 9) : f();
}

var address;

function getAddressTransactions()
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

      var date;
      var value;

      for(var i = 0; i < result.length; i++)
      {
        value = 0;

        date = new Date(result[i].datum * 1000);
        date = date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + " " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

        for(var j = 0; j < result[i].ulazi.length; j++)
        {
          if(result[i].ulazi[j].pošiljalac == address)
          {
            value -= result[i].ulazi[j].vrijednost;
          }
        }

        for(var j = 0; j < result[i].izlazi.length; j++)
        {
          if(result[i].izlazi[j].primalac == address)
          {
            value += result[i].izlazi[j].vrijednost;
          }
        }

        document.getElementById("addressTransactions").innerHTML += "\
          <div class=\"address-tr address-tr--values\">\
            <div class=\"address-td\">\
              " + date + "\
            </div>\
            <div class=\"address-td\">\
              <a href=\"/transakcija/" + result[i].transakcija + "\">" + result[i].transakcija + "</a>\
            </div>\
            <div class=\"address-td " + ((value > 0) ? "received" : "spent") + "\">\
              <span class=\"value\">" + ((value > 0) ? "+" : "") + value + "</span>\
              <span class=\"currency\"> VDN</span>\
            </div>\
          </div>\
        ";
      }

      if(result.length == 10)
      {
        document.getElementById("addressTransactions").outerHTML += "\
          <span class=\"disclaimer\">\
            * Showing only last 10 transactions.\
          </span>\
        ";
      }
    }
  };

  xhttp.open("GET", "/aps/v1.0/adresnetransakcije?adresa=" + address, true);
  xhttp.send();
}

function getAddress()
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

  address = document.getElementById("address").innerHTML;

  xhttp.onreadystatechange = function()
  {
    if(this.readyState == 4 && this.status == 200)
    {
      const result = JSON.parse(this.responseText);

      const received = result.primljeno + result.nepotvrđenoPrimljeno;
      const spent = result.potrošeno + result.nepotvrđenoPotrošeno;
      const credit = received - spent;

      document.getElementById("addressCredit").innerHTML = credit;
      document.getElementById("addressReceived").innerHTML = received;
      document.getElementById("addressSpent").innerHTML = spent;

      getAddressTransactions();
    }
  };

  xhttp.open("GET", "/aps/v1.0/adresa?adresa=" + address, true);
  xhttp.send();
}

r(function()
  {
    getAddress();
  });
