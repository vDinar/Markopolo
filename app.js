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

          res.json({
            adresa: result.address,
            primljeno: result.received,
            potrošeno: result.spent,
            nepotvrđenoPrimljeno: result.unconfirmedReceived,
            nepotvrđenoPotrošeno: result.unconfirmedSpent
          })
          db.close()
        }
      )
    })
  } else {
    res.json({ greška: true, poruka: 'Adresa nije važeća.' })
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

          var translation = []

          for (var i = 0; i < result.length; i++) {
            var inputs = []
            var outputs = []

            for (var j = 0; j < result[i].inputs.length; j++) {
              inputs.push({
                temeljni: result[i].inputs[j].coinbase,
                pošiljalac: result[i].inputs[j].sender,
                vrijednost: result[i].inputs[j].value
              })
            }

            for (var j = 0; j < result[i].outputs.length; j++) {
              outputs.push({
                primalac: result[i].outputs[j].recipient,
                vrijednost: result[i].outputs[j].value
              })
            }

            translation.push({
              transakcija: result[i].transaction,
              blok: result[i].block,
              potvrđena: result[i].confirmed,
              ulazi: inputs,
              izlazi: outputs,
              datum: result[i].timestamp,
              vrijednost: result[i].value
            })
          }

          res.json(translation)
          db.close()
        }
      )
    })
  } else {
    res.json({ greška: true, poruka: 'Adresa nije važeća.' })
  }
})

app.get('/aps/v1.0/blok', function (req, res) {
  if (typeof req.query.rezultat != 'undefined') {
    const hash = req.query.rezultat
    const hashReg = new RegExp('^([a-zA-Z0-9]{64})$')

    if (hashReg.test(hash)) {
      client.getBlock(hash).then((result) => res.json(result))
      .catch((error) => {
        res.json({ greška: true, poruka: 'Rezultat bloka nije poznat.' })
      })
    } else {
      res.json({ greška: true, poruka: 'Rezultat bloka nije važeći.' })
    }
  } else if (typeof req.query.pozicija != 'undefined') {
    const index = parseInt(req.query.pozicija)

    if (index >= 0) {
      client.getBlockchainInfo().then(info => {
        if (info.blocks >= index) {
          client.getBlockHash(index).then(hash => {
            client.getBlock(hash).then(result => {
              res.json({
                rezultat: result.hash,
                potvrde: result.confirmations,
                veličina: result.size,
                pozicija: result.height,
                verzija: result.version,
                rezultatTransakcija: result.merkleroot,
                transakcije: result.tx,
                datum: result.time,
                razmak: result.nonce,
                jedinice: result.bits,
                težina: result.difficulty,
                rezultatPrethodnogBloka: result.previousblockhash,
                rezultatSljedećegBloka: result.nextblockhash
              })
            })
          })
        } else {
          res.json({ greška: true, poruka: 'Pozicija bloka je veća od trenutačne visine lanca blokova.' })
        }
      })
    } else {
      res.json({ greška: true, poruka: 'Pozicija bloka je negativna ili nije broj.' })
    }
  }
  else
  {
    res.json({ greška: true, poruka: 'Potreban je rezultat bloka ili njegova pozicija.' })
  }
})

app.get('/aps/v1.0/blokputemrezultata', function (req, res) {
  if (typeof req.query.rezultat != 'undefined') {
    const hash = req.query.rezultat
    const hashReg = new RegExp('^([a-zA-Z0-9]{64})$')

    if (hashReg.test(hash)) {
      client.getBlock(hash).then((result) => res.json({
        rezultat: result.hash,
        potvrde: result.confirmations,
        veličina: result.size,
        pozicija: result.height,
        verzija: result.version,
        rezultatTransakcija: result.merkleroot,
        transakcije: result.tx,
        datum: result.time,
        razmak: result.nonce,
        jedinice: result.bits,
        težina: result.difficulty,
        rezultatPrethodnogBloka: result.previousblockhash,
        rezultatSljedećegBloka: result.nextblockhash
      }))
      .catch((error) => {
        res.json({ greška: true, poruka: 'Rezultat bloka nije poznat.' })
      })
    } else {
      res.json({ greška: true, poruka: 'Rezultat bloka nije važeći.' })
    }
  } else {
    res.json({ greška: true, poruka: 'Potreban je rezultat bloka.' })
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
              res.json({
                rezultat: result.hash,
                potvrde: result.confirmations,
                veličina: result.size,
                pozicija: result.height,
                verzija: result.version,
                rezultatTransakcija: result.merkleroot,
                transakcije: result.tx,
                datum: result.time,
                razmak: result.nonce,
                jedinice: result.bits,
                težina: result.difficulty,
                rezultatPrethodnogBloka: result.previousblockhash,
                rezultatSljedećegBloka: result.nextblockhash
              })
            })
          })
        } else {
          res.json({ greška: true, poruka: 'Pozicija bloka je veća od trenutačne visine lanca blokova.' })
        }
      })
    } else {
      res.json({ greška: true, poruka: 'Pozicija bloka je negativna ili nije broj.' })
    }
  }
  else
  {
    res.json({ greška: true, poruka: 'Potrebna je pozicija bloka.' })
  }
})

app.get('/aps/v1.0/lanacblokova', function (req, res) {
  client.getBlockchainInfo().then((result) => res.json({
    blokovi: result.blocks,
    nFaktor: result.nfactor,
    nMultiplikator: result.nmultiplicator,
    k25Aktivan: result.k25active,
    vremenskiRazmak: result.timeoffset,
    eksperimentalnaMreža: result.testnet,
    greške: result.errors
  }))
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
          res.json({ greška: true, poruka: 'Pozicija bloka je veća od trenutačne visine lanca blokova.' })
        }
      })
    } else {
      res.json({ greška: true, poruka: 'Pozicija bloka je negativna ili nije broj.' })
    }
  }
  else
  {
    res.json({ greška: true, poruka: 'Potrebna je pozicija bloka.' })
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
            blocks[bestHeight - result.height] = {
              rezultat: result.hash,
              potvrde: result.confirmations,
              veličina: result.size,
              pozicija: result.height,
              verzija: result.version,
              rezultatTransakcija: result.merkleroot,
              transakcije: result.tx,
              datum: result.time,
              razmak: result.nonce,
              jedinice: result.bits,
              težina: result.difficulty,
              rezultatPrethodnogBloka: result.previousblockhash,
              rezultatSljedećegBloka: result.nextblockhash
            }
            calculated++

            if (calculated == 10) {
              res.json(blocks)
            }
          })
        })
      } else {
        blocks[i] = { greška: true, poruka: 'Blok ima negativnu poziciju.' }
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

      var translation = []

      for (var i = 0; i < result.length; i++) {
        var inputs = []
        var outputs = []

        for (var j = 0; j < result[i].inputs.length; j++) {
          inputs.push({
            temeljni: result[i].inputs[j].coinbase,
            pošiljalac: result[i].inputs[j].sender,
            vrijednost: result[i].inputs[j].value
          })
        }

        for (var j = 0; j < result[i].outputs.length; j++) {
          outputs.push({
            primalac: result[i].outputs[j].recipient,
            vrijednost: result[i].outputs[j].value
          })
        }

        translation.push({
          pozicija: result[i]._id,
          transakcija: result[i].transaction,
          blok: result[i].block,
          potvrđena: result[i].confirmed,
          ulazi: inputs,
          izlazi: outputs,
          datum: result[i].timestamp,
          vrijednost: result[i].value
        })
      }

      res.json(translation)
      db.close();
    });
  });
})

app.get('/aps/v1.0/rudarenje', function (req, res) {
  client.getMiningInfo().then((result) => res.json({
    blokovi: result.blocks,
    nFaktor: result.nfactor,
    k25Aktivan: result.k25active,
    trenutačnaVeličinaBloka: result.currentblocksize,
    trenutačniBrojTransakcija: result.currentblocktx,
    težina: result.difficulty,
    greške: result.errors,
    rudarskaJačinaMreže: result.networkhashps,
    transakcijeUIščekivanju: result.pooledtx,
    eksperimentalnaMreža: result.testnet
  }))
})

app.get('/aps/v1.0/izvornatransakcija', function (req, res) {
  if (typeof req.query.rezultat != 'undefined') {
    const id = req.query.rezultat
    const idReg = new RegExp('^([a-zA-Z0-9]{64})$')

    if (idReg.test(id)) {
      client.getRawTransaction(id).then((result) => res.json(result))
      .catch((error) => {
        res.json({ greška: true, poruka: 'Rezultat transakcije nije poznat.' })
      })
    } else {
      res.json({ greška: true, poruka: 'Rezultat transakcije nije važeći.' })
    }
  } else {
    res.json({ greška: true, poruka: 'Potreban je rezultat transakcije.' })
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

        res.json({
          potvrđeno: result.supply, nepotvrđeno: result.unconfirmedSupply
        })
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

          var inputs = []
          var outputs = []

          for (var i = 0; i < result.inputs.length; i++) {
            inputs.push({
              temeljni: result.inputs[i].coinbase,
              pošiljalac: result.inputs[i].sender,
              vrijednost: result.inputs[i].value
            })
          }

          for (var i = 0; i < result.outputs.length; i++) {
            outputs.push({
              primalac: result.outputs[i].recipient,
              vrijednost: result.outputs[i].value
            })
          }

          res.json({
            pozicija: result._id,
            transakcija: result.transaction,
            blok: result.block,
            potvrđena: result.confirmed,
            ulazi: inputs,
            izlazi: outputs,
            datum: result.timestamp,
            vrijednost: result.value
          })
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

          var inputs = []
          var outputs = []

          for (var i = 0; i < result.inputs.length; i++) {
            inputs.push({
              temeljni: result.inputs[i].coinbase,
              pošiljalac: result.inputs[i].sender,
              vrijednost: result.inputs[i].value
            })
          }

          for (var i = 0; i < result.outputs.length; i++) {
            outputs.push({
              primalac: result.outputs[i].recipient,
              vrijednost: result.outputs[i].value
            })
          }

          res.json({
            pozicija: result._id,
            transakcija: result.transaction,
            blok: result.block,
            potvrđena: result.confirmed,
            ulazi: inputs,
            izlazi: outputs,
            datum: result.timestamp,
            vrijednost: result.value
          })
          db.close()
        }
      )
    })
  } else {
    res.json({ greška: true, poruka: 'Identifikator transakcije nije ni rezultat transakcije ni broj.' })
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
        res.json({ putanja: '/blok/' + index })
      } else {
        res.json({ greška: true, poruka: 'Pozicija bloka je veća od visine lanca blokova.' })
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
            res.json({ putanja: '/transakcija/' + string })
          } else {
            client.getBlock(string).then(block => {
              res.json({ putanja: '/blok/' + string })
            }).catch(error => {
              res.json({ greška: true, poruka: 'Tekst nije poznat ni kao rezultat bloka ni kao rezultat transakcije.' })
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
            res.json({ putanja: '/adresa/' + string })
          }
          else {
            res.json({ greška: true, poruka: 'Adresa nije poznata.' })
          }
          db.close()
        }
      )
    })
  } else {
    res.json({ greška: true, poruka: 'Tekst nije u prepoznatljivom formatu.' })
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
