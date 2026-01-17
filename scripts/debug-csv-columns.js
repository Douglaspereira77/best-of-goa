const fs = require('fs')
const csv = require('csv-parser')

const csvPath = 'C:\\Users\\Douglas\\Downloads\\Gym_data.csv'

let first = true

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    if (first) {
      console.log('Column names from first row:')
      Object.keys(row).forEach((key, i) => {
        if (i < 30) { // First 30 columns
          console.log(`  [${i}] "${key}" = "${row[key]}"`)
        }
      })
      first = false
      process.exit(0)
    }
  })
