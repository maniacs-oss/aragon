import { Stock } from './contracts'
import Company from './deployed'

class StockWatcher {
  constructor() {
    this.setupCollections()
    this.getAllStocks()
    this.listenForNewStock()
  }

  setupCollections() {
    this.Stocks = new Mongo.Collection('stock_collection', { connection: null })
    this.persistentStock = new PersistentMinimongo(this.Stocks)
  }

  listenForNewStock() {
    Company.IssuedStock({}).watch((err, ev) => this.getStock(ev.args.stockAddress, ev.args.stockIndex))
  }

  async getAllStocks() {
    const lastId = await Company.stockIndex.call().then(x => x.valueOf())
    const addressesPromises = _.range(lastId).map(id => Company.stocks.call(id))
    const stockAddresses = await Promise.all(addressesPromises)

    await Promise.all(stockAddresses.map((a, i) => this.getStock(a, i)))

    this.Stocks.remove({ address: { $nin: stockAddresses } })
  }

  async getStock(address, index) {
    console.log('updating', index)
    this.trackStock(address)
    await this.updateStock(address, index)
  }

  trackStock(address) {
    console.log('Tracking stock at', address)
    Stock.at(address).Transfer({}).watch(() => {
      this.updateStock(address)
    })
  }

  async updateStock(address, index) {
    const timestamp = Math.floor(+new Date() / 1000)
    const stock = Stock.at(address)
    const stockObject = {
      name: stock.name.call(),
      symbol: stock.symbol.call(),
      votesPerShare: stock.votesPerShare.call().then(x => +x.valueOf()),
      shareholders: stock.shareholderIndex.call().then(x => +x.valueOf()),
      index,
      address,
      timestamp,
    }
    const stockInfo = await Promise.allProperties(stockObject)
    this.Stocks.upsert(`s_${address}`, stockInfo)
  }
}

export default new StockWatcher()
