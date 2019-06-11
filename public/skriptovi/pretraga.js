function search()
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

      if(result.hasOwnProperty("greška"))
      {
        alert(result.poruka);
      }
      else
      {
        window.location.href = result.putanja;
      }
    }
  };

  xhttp.open("GET", "/aps/v1.0/pretraga?tekst=" + document.getElementById("searchText").value, true);
  xhttp.send();
}
