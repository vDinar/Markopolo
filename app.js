const express = require('express')
const Client = require('@vdinar/vdinar-rpc')

const app = express()
const port = 8000

const client = new Client({ username: 'testuser', password: 'testpassword', port: '9433' })

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = "mongodb://localhost:27017/";

app.set('view engine', 'pug')

app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
  res.render('homepage', { title: 'vDinar Pretraživač' })
})

app.get('/adresa/:address', function (req, res) {
  const address = req.params.address
  const addressReg = new RegExp('^([a-zA-Z0-9]{34})$')

  if (!addressReg.test(address)) {
    res.redirect('/')
  } else {
    res.render('address', { title: 'vDinar Pretraživač', address: address })
  }
})

app.get('/aps', function (req, res) {
  res.render('api', { title: 'vDinar Pretraživač' })
})

app.get('/aps/v1.0/adresa', function (req, res) {
  const address = req.query.adresa
  const addressReg = new RegExp('^([a-zA-Z0-9]{34})$')

  if (addressReg.test(address)) {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        throw err
      }
      var dbo = db.db("markopolo")

      dbo.collection("addresses").findOne(
        { address: address },
        function(err, result) {
          if (err) {
            throw err
          }

          res.json(result)
          db.close()
        }
      )
    })
  } else {
    res.json({ error: true, message: 'Adresa nije važeća.' })
  }
})

app.get('/aps/v1.0/adresnetransakcije', function (req, res) {
  const address = req.query.adresa
  const addressReg = new RegExp('^([a-zA-Z0-9]{34})$')

  var offset = 0;

  if (typeof req.query.stranica != 'undefined') {
    const page = Math.max(0, parseInt(req.query.stranica) - 1)
    offset = page * 10
  }

  if (addressReg.test(address)) {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        throw err
      }
      var dbo = db.db("markopolo")

      dbo.collection("transactions").find(
        {
          $or: [
            {
              inputs: {
                $elemMatch: {
                  sender: address
                }
              }
            },
            {
              outputs: {
                $elemMatch: {
                  recipient: address
                }
              }
            }
          ]
        }
      ).sort(
        {
          timestamp: -1
        }
      ).skip(offset).limit(10).toArray(
        function(err, result) {
          if (err) {
            throw err
          }

          res.json(result)
          db.close()
        }
      )
    })
  } else {
    res.json({ error: true, message: 'Adresa nije važeća.' })
  }
})

app.get('/aps/v1.0/blok', function (req, res) {
  if (typeof req.query.rezultat != 'undefined') {
    const hash = req.query.rezultat
    const hashReg = new RegExp('^([a-zA-Z0-9]{64})$')

    if (hashReg.test(hash)) {
      client.getBlock(hash).then((result) => res.json(result))
      .catch((error) => {
        res.json({ error: true, message: 'Rezultat bloka nije poznat.' })
      })
    } else {
      res.json({ error: true, message: 'Rezultat bloka nije važeći.' })
    }
  } else if (typeof req.query.pozicija != 'undefined') {
    const index = parseInt(req.query.pozicija)

    if (index >= 0) {
      client.getBlockchainInfo().then(info => {
        if (info.blocks >= index) {
          client.getBlockHash(index).then(hash => {
            client.getBlock(hash).then(result => {
              res.json(result)
            })
          })
        } else {
          res.json({ error: true, message: 'Pozicija bloka je veća od trenutačne visine lanca blokova.' })
        }
      })
    } else {
      res.json({ error: true, message: 'Pozicija bloka je negativna ili nije broj.' })
    }
  }
  else
  {
    res.json({ error: true, message: 'Potreban je rezultat bloka ili njegova pozicija.' })
  }
})

app.get('/aps/v1.0/blokputemrezultata', function (req, res) {
  if (typeof req.query.rezultat != 'undefined') {
    const hash = req.query.rezultat
    const hashReg = new RegExp('^([a-zA-Z0-9]{64})$')

    if (hashReg.test(hash)) {
      client.getBlock(hash).then((result) => res.json(result))
      .catch((error) => {
        res.json({ error: true, message: 'Rezultat bloka nije poznat.' })
      })
    } else {
      res.json({ error: true, message: 'Rezultat bloka nije važeći.' })
    }
  } else {
    res.json({ error: true, message: 'Potreban je rezultat bloka.' })
  }
})

app.get('/aps/v1.0/blokputempozicije', function (req, res) {
  if (typeof req.query.pozicija != 'undefined') {
    const index = parseInt(req.query.pozicija)

    if (index >= 0) {
      client.getBlockchainInfo().then(info => {
        if (info.blocks >= index) {
          client.getBlockHash(index).then(hash => {
            client.getBlock(hash).then(result => {
              res.json(result)
            })
          })
        } else {
          res.json({ error: true, message: 'Pozicija bloka je veća od trenutačne visine lanca blokova.' })
        }
      })
    } else {
      res.json({ error: true, message: 'Pozicija bloka je negativna ili nije broj.' })
    }
  }
  else
  {
    res.json({ error: true, message: 'Potrebna je pozicija bloka.' })
  }
})

app.get('/aps/v1.0/lanacblokova', function (req, res) {
  client.getBlockchainInfo().then((result) => res.json(result))
})

app.get('/aps/v1.0/rezultatbloka', function (req, res) {
  if (typeof req.query.pozicija != 'undefined') {
    const index = parseInt(req.query.pozicija)

    if (index >= 0) {
      client.getBlockchainInfo().then(info => {
        if (info.blocks >= index) {
          client.getBlockHash(index).then(hash => {
            res.json(hash)
          })
        } else {
          res.json({ error: true, message: 'Pozicija bloka je veća od trenutačne visine lanca blokova.' })
        }
      })
    } else {
      res.json({ error: true, message: 'Pozicija bloka je negativna ili nije broj.' })
    }
  }
  else
  {
    res.json({ error: true, message: 'Potrebna je pozicija bloka.' })
  }
})

app.get('/aps/v1.0/zadnjiblokovi', function (req, res) {
  var offset = 0;

  if (typeof req.query.stranica != 'undefined') {
    const page = Math.max(0, parseInt(req.query.stranica) - 1)
    offset = page * 10
  }

  var blocks = []
  var calculated = 0;

  client.getBlockchainInfo().then((info) => {
    const bestHeight = info.blocks - offset

    for (var i = 0; i < 10; i++) {
      const height = bestHeight - i

      if (height >= 0) {
        client.getBlockHash(height).then((hash) => {
          client.getBlock(hash).then((result) => {
            blocks[bestHeight - result.height] = result
            calculated++

            if (calculated == 10) {
              res.json(blocks)
            }
          })
        })
      } else {
        blocks[i] = { error: true, message: 'Blok ima negativnu poziciju.' }
        calculated++

        if (calculated == 10) {
          res.json(blocks)
        }
      }
    }
  })
})

app.get('/aps/v1.0/zadnjetransakcije', function (req, res) {
  var offset = 0;

  if (typeof req.query.stranica != 'undefined') {
    const page = Math.max(0, parseInt(req.query.stranica) - 1)
    offset = page * 10
  }

  MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
    if (err) {
      throw err;
    }
    var dbo = db.db("markopolo");
    dbo.collection("transactions").find().sort({ _id: -1 }).skip(offset).limit(10).toArray(function(err, result) {
      if (err) {
        throw err;
      }

      res.json(result);
      db.close();
    });
  });
})

app.get('/aps/v1.0/rudarenje', function (req, res) {
  client.getMiningInfo().then((result) => res.json(result))
})

app.get('/aps/v1.0/izvornatransakcija', function (req, res) {
  if (typeof req.query.broj != 'undefined') {
    const id = req.query.broj
    const idReg = new RegExp('^([a-zA-Z0-9]{64})$')

    if (hashReg.test(id)) {
      client.getRawTransaction(id).then((result) => res.json(result))
      .catch((error) => {
        res.json({ error: true, message: 'Broj transakcije nije poznat.' })
      })
    } else {
      res.json({ error: true, message: 'Broj transakcije nije važeći.' })
    }
  } else {
    res.json({ error: true, message: 'Potreban je broj transakcije.' })
  }
})

app.get('/aps/v1.0/proizvod', function (req, res) {
  MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
    if (err) {
      throw err
    }
    var dbo = db.db("markopolo")

    dbo.collection("info").findOne(
      { _id: 0 },
      function(err, result) {
        if (err) {
          throw err
        }

        res.json({ confirmed: result.supply, unconfirmed: result.unconfirmedSupply })
        db.close()
      }
    )
  })
})

app.get('/aps/v1.0/transakcija', function (req, res) {
  const id = req.query.identifikator
  const idReg = new RegExp('^([a-zA-Z0-9]{64})$')
  const numericIdReg = new RegExp('^([0-9]+)$')

  if (idReg.test(id)) {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        throw err
      }
      var dbo = db.db("markopolo")

      dbo.collection("transactions").findOne(
        { transaction: id },
        function(err, result) {
          if (err) {
            throw err
          }

          res.json(result)
          db.close()
        }
      )
    })
  } else if (numericIdReg.test(id)) {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        throw err
      }
      var dbo = db.db("markopolo")

      dbo.collection("transactions").findOne(
        { _id: parseInt(id) },
        function(err, result) {
          if (err) {
            throw err
          }

          res.json(result)
          db.close()
        }
      )
    })
  } else {
    res.json({ error: true, message: 'Identifikator transakcije nije ni rezultat transakcije ni broj.' })
  }
})

app.get('/aps/v1.0/pretraga', function (req, res) {
  const string = req.query.tekst
  const idReg = new RegExp('^([0-9]+)$')
  const hashReg = new RegExp('^([a-zA-Z0-9]{64})$')
  const addressReg = new RegExp('^([a-zA-Z0-9]{34})$')

  if (idReg.test(string)) {
    const index = parseInt(string);

    client.getBlockchainInfo().then(info => {
      if (info.blocks >= index) {
        res.json({ url: '/blok/' + index })
      } else {
        res.json({ error: true, message: 'Pozicija bloka je veća od visine lanca blokova.' })
      }
    })
  } else if (hashReg.test(string)) {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        throw err
      }
      var dbo = db.db("markopolo")

      dbo.collection("transactions").findOne(
        { transaction: string },
        function(err, result) {
          if (err) {
            throw err
          }

          if (result) {
            res.json({ url: '/transakcija/' + string })
          } else {
            client.getBlock(string).then(block => {
              res.json({ url: '/blok/' + string })
            }).catch(error => {
              res.json({ error: true, message: 'Tekst nije poznat ni kao rezultat bloka ni kao rezultat transakcije.' })
            })
          }
        }
      )
    })
  } else if (addressReg.test(string)) {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        throw err
      }
      var dbo = db.db("markopolo")

      dbo.collection("addresses").findOne(
        { address: string },
        function(err, result) {
          if (err) {
            throw err
          }

          if (result) {
            res.json({ url: '/adresa/' + string })
          }
          else {
            res.json({ error: true, message: 'Adresa nije poznata.' })
          }
          db.close()
        }
      )
    })
  } else {
    res.json({ error: true, message: 'Tekst nije u prepoznatljivom formatu.' })
  }
})

app.get('/blok/:block', function (req, res) {
  const block = req.params.block
  const hashReg = new RegExp('^([a-zA-Z0-9]{64})$')
  const idReg = new RegExp('^([0-9]+)$')

  if (!hashReg.test(block) && !idReg.test(block)) {
    res.redirect('/')
  } else {
    if (!hashReg.test(block)) {
      const index = parseInt(block);

      client.getBlockchainInfo().then(info => {
        if (info.blocks >= index) {
          client.getBlockHash(index).then(hash => {
            res.redirect('/blok/' + hash)
          })
        } else {
          res.redirect('/')
        }
      })

    } else {
      res.render('block', { title: 'vDinar Pretraživač', block: block })
    }
  }
})

app.get('/transakcija/:txid', function (req, res) {
  const id = req.params.txid
  const idReg = new RegExp('^([a-zA-Z0-9]{64})$')
  const numericIdReg = new RegExp('^([0-9]+)$')

  if (!idReg.test(id) && !numericIdReg.test(id)) {
    res.redirect('/transakcije')
  } else {
    if (!idReg.test(id)) {
      MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
        if (err) {
          throw err
        }
        var dbo = db.db("markopolo")

        dbo.collection("transactions").findOne(
          { _id: parseInt(id) },
          function(err, result) {
            if (err) {
              throw err
            }

            res.redirect('/transakcija/' + result.transaction)
            db.close()
          }
        )
      })
    } else {
      res.render('transaction', { title: 'vDinar Pretraživač', transaction: id })
    }
  }
})

app.get('/transakcije', function (req, res) {
  res.render('transactions', { title: 'vDinar Pretraživač' })
})

app.listen(port, () => console.log(`Markopolo explorer listening on port ${port}!`))
