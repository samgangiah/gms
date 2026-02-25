import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 9,
    textAlign: 'right',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginVertical: 6,
  },
  // Info grid
  infoGrid: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLeft: {
    width: '50%',
    flexDirection: 'row',
  },
  infoRight: {
    width: '50%',
    flexDirection: 'row',
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 9,
    textDecoration: 'underline',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 9,
  },
  // Table
  table: {
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginBottom: 2,
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#999',
    paddingVertical: 2,
  },
  colPiece: {
    width: '55%',
    fontSize: 9,
  },
  colWeight: {
    width: '45%',
    fontSize: 9,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    fontSize: 9,
  },
  // Totals
  totalsSection: {
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 10,
    marginRight: 8,
  },
  totalValue: {
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 1,
    minWidth: 60,
  },
  // Signature
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '30%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 2,
    minHeight: 25,
  },
  signatureLabel: {
    fontWeight: 'bold',
    fontSize: 8,
    textDecoration: 'underline',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
  },
});

type PackingListPDFProps = {
  packingList: any;
};

export const PackingListPDF = ({ packingList }: PackingListPDFProps) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Build content string: "Tex, Type, %, Name" for each fabric content
  const contentString = packingList.jobCard?.fabricQuality?.fabricContent
    ?.map((fc: any) => {
      const tex = fc.yarnType?.texCount || '';
      const material = fc.yarnType?.material || fc.yarnType?.code || '';
      const pct = fc.percentage || '';
      const name = fc.yarnType?.supplierName || fc.yarnType?.description || '';
      return [tex, material, pct, name].filter(Boolean).join(', ');
    })
    .join(' | ') || '';

  // Calculate totals
  const totalWeight = packingList.items?.reduce(
    (sum: number, item: any) => sum + (item.production?.weight || 0),
    0
  ) || 0;
  const totalRolls = packingList.items?.length || 0;

  const now = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Company and Date */}
        <View style={styles.headerRow}>
          <Text style={styles.companyName}>Gilnokie</Text>
          <View>
            <Text style={styles.dateText}>{formatDate(now)}</Text>
            <Text style={styles.dateText}>{formatTime(now)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Customer Name:</Text>
              <Text style={styles.infoValue}>{packingList.jobCard?.customer?.name || ''}</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>Fabric Description:</Text>
              <Text style={styles.infoValue}>
                {packingList.jobCard?.fabricQuality?.description || packingList.jobCard?.fabricQuality?.qualityCode || ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Order No:</Text>
              <Text style={styles.infoValue}>{packingList.jobCard?.orderNumber || ''}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Quality No:</Text>
              <Text style={styles.infoValue}>{packingList.jobCard?.fabricQuality?.qualityCode || ''}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Finish Refer:</Text>
              <Text style={styles.infoValue}>{packingList.jobCard?.stockReference || ''}</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>Delivery Note No:</Text>
              <Text style={styles.infoValue}>{packingList.packingListNumber}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft} />
            <View style={styles.infoRight}>
              <Text style={{ ...styles.infoLabel, fontSize: 8 }}>Tex - Type - % - Name</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Greige Width:</Text>
              <Text style={styles.infoValue}>
                {packingList.jobCard?.fabricQuality?.width ? `${packingList.jobCard.fabricQuality.width}cms` : ''}
              </Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>Content:</Text>
              <Text style={{ ...styles.infoValue, fontSize: 8 }}>{contentString}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Greige Weight:</Text>
              <Text style={styles.infoValue}>
                {packingList.jobCard?.fabricQuality?.weight ? `${packingList.jobCard.fabricQuality.weight}gms` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colPiece, styles.tableHeaderText]}>Piece No:</Text>
            <Text style={[styles.colWeight, styles.tableHeaderText]}>Weight:</Text>
          </View>
          {packingList.items?.map((item: any, index: number) => (
            <View key={item.id || index} style={styles.tableDataRow}>
              <Text style={styles.colPiece}>{item.production?.pieceNumber || ''}</Text>
              <Text style={styles.colWeight}>
                {item.production?.weight ? item.production.weight.toFixed(2) : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total For This Pack Slip :</Text>
            <Text style={styles.totalValue}>{totalWeight.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Rolls For This Pack Slip :</Text>
            <Text style={styles.totalValue}>{totalRolls}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By :</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Name :</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date :</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Gilnokie Textile Management System
        </Text>
      </Page>
    </Document>
  );
};
