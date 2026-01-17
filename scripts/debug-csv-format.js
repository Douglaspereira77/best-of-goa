require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const csv = require('csv-parser')

const csvPath = 'C:\\Users\\Douglas\\Downloads\\Gym_data.csv'

console.log('🔍 Debugging CSV format...\n')

let rowCount = 0
const rows = []

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    rowCount++
    if (rowCount <= 3) {
      rows.push(row)
    }
  })
  .on('end', () => {
    console.log(`Total rows in CSV: ${rowCount}\n`)

    console.log('First 3 rows:')
    rows.forEach((row, i) => {
      console.log(`\nRow ${i + 1}:`)
      console.log('Column names:', Object.keys(row))
      console.log('Raw row data:', JSON.stringify(row, null, 2))

      // Try to parse if there's a 'data' column
      if (row.data) {
        try {
          const parsed = JSON.parse(row.data)
          console.log('Parsed data.title:', parsed.title)
          console.log('Parsed data.address:', parsed.address)
        } catch (err) {
          console.log('Error parsing data column:', err.message)
        }
      }
    })
  })
