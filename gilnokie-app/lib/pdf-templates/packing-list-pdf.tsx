import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 2,
  },
  summary: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
});

type PackingListPDFProps = {
  packingList: any;
};

export const PackingListPDF = ({ packingList }: PackingListPDFProps) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Packing List: {packingList.packingListNumber}</Text>
          <Text style={styles.subtitle}>
            Gilnokie Textile Management System | Generated: {formatDate(new Date())}
          </Text>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Job Card:</Text>
            <Text style={styles.value}>{packingList.jobCard.jobCardNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{packingList.jobCard.customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fabric Quality:</Text>
            <Text style={styles.value}>{packingList.jobCard.fabricQuality.qualityCode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Packing Date:</Text>
            <Text style={styles.value}>{formatDate(packingList.packingDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{packingList.packingStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* Packing Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Number of Cartons:</Text>
            <Text>{packingList.numberOfCartons}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Net Weight:</Text>
            <Text>{formatWeight(packingList.totalNetWeight)}</Text>
          </View>
          {packingList.totalGrossWeight && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Gross Weight:</Text>
              <Text>{formatWeight(packingList.totalGrossWeight)}</Text>
            </View>
          )}
        </View>

        {/* Items List */}
        {packingList.items?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Packed Items</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Item #</Text>
                <Text style={styles.tableCell}>Piece Number</Text>
                <Text style={styles.tableCell}>Weight</Text>
                <Text style={styles.tableCell}>Quality Grade</Text>
              </View>
              {packingList.items.map((item: any, index: number) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{index + 1}</Text>
                  <Text style={styles.tableCell}>{item.production.pieceNumber}</Text>
                  <Text style={styles.tableCell}>{formatWeight(item.production.weight)}</Text>
                  <Text style={styles.tableCell}>{item.production.qualityGrade || 'N/A'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Packing Notes */}
        {packingList.packingNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Packing Notes</Text>
            <Text>{packingList.packingNotes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <View style={{ marginTop: 20 }}>
            <View style={styles.row}>
              <View style={{ width: '50%' }}>
                <Text style={{ marginBottom: 30 }}>Packed By:</Text>
                <Text>_________________________</Text>
                <Text style={{ fontSize: 8, marginTop: 5 }}>Signature & Date</Text>
              </View>
              <View style={{ width: '50%' }}>
                <Text style={{ marginBottom: 30 }}>Checked By:</Text>
                <Text>_________________________</Text>
                <Text style={{ fontSize: 8, marginTop: 5 }}>Signature & Date</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Gilnokie Textile Management System | This is a computer-generated document
        </Text>
      </Page>
    </Document>
  );
};
