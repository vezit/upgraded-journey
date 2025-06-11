import { Document, Page, Text, View, Font, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import currency from 'currency.js'

Font.register({ family: 'Inter', src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2' })

const s = StyleSheet.create({
  page:{ padding:40, fontFamily:'Inter', fontSize:11, color:'#222' },
  h1:{ fontSize:20, marginBottom:8, color:'#ff7a00' },
  grid:{ flexDirection:'row', justifyContent:'space-between', marginBottom:20 },
  th:{ fontSize:12, marginBottom:4 },
  row:{ flexDirection:'row', borderBottom:'1 solid #eee', paddingVertical:4 },
  cell:{ flex:4 }, qty:{ flex:1, textAlign:'right' }, price:{ flex:2, textAlign:'right' },
  totalRow:{ flexDirection:'row', justifyContent:'flex-end', marginTop:10 },
})

export function InvoicePDF({ invoice }:{ invoice:any }){
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.grid}>
          <Text style={s.h1}>REIPUR</Text>
          <View>
            <Text>Faktura #{invoice.number}</Text>
            <Text>{format(new Date(invoice.date),'dd/MM/yyyy')}</Text>
          </View>
        </View>

        <View style={{ marginBottom:20 }}>
          <Text style={s.th}>Fakturér til</Text>
          <Text>{invoice.customer.name}</Text>
          <Text>{invoice.customer.address}</Text>
          <Text>{invoice.customer.zip} {invoice.customer.city}</Text>
          <Text>{invoice.customer.country}</Text>
        </View>

        <View>
          <View style={[s.row,{ fontWeight:'bold' }]}>
            <Text style={s.cell}>Varenavn</Text>
            <Text style={s.qty}>Antal</Text>
            <Text style={s.price}>Pris</Text>
          </View>
          {invoice.items.map((it:any,i:number)=>(
            <View key={i} style={s.row}>
              <Text style={s.cell}>{it.name}</Text>
              <Text style={s.qty}>{it.qty}</Text>
              <Text style={s.price}>{currency(it.total,{symbol:''}).format()} kr.</Text>
            </View>
          ))}
        </View>

        <View style={s.totalRow}>
          <View style={{ width:150 }}>
            <Text>Subtotal: {invoice.subtotal} kr.</Text>
            <Text>Moms (25 %): {invoice.vat} kr.</Text>
            <Text style={{ fontWeight:'bold' }}>Total: {invoice.total} kr.</Text>
          </View>
        </View>

        <Text style={{ marginTop:40,fontSize:9,color:'#666' }}>
          REIPUR · CVR 36237341 · victor@reipur.dk
        </Text>
      </Page>
    </Document>
  )
}
