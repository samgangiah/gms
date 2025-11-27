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
  addressBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
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

type DeliveryNotePDFProps = {
  delivery: any;
};

export const DeliveryNotePDF = ({ delivery }: DeliveryNotePDFProps) => {
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
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
          <Text style={styles.title}>Delivery Note: {delivery.deliveryNoteNumber}</Text>
          <Text style={styles.subtitle}>
            Gilnokie Textile Management System | Generated: {formatDate(new Date())}
          </Text>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Job Card:</Text>
            <Text style={styles.value}>{delivery.jobCard.jobCardNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{delivery.jobCard.customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fabric Quality:</Text>
            <Text style={styles.value}>{delivery.jobCard.fabricQuality.qualityCode}</Text>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Method:</Text>
            <Text style={styles.value}>{delivery.deliveryMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Scheduled Date:</Text>
            <Text style={styles.value}>{formatDate(delivery.scheduledDeliveryDate)}</Text>
          </View>
          {delivery.deliveryDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Actual Delivery Date:</Text>
              <Text style={styles.value}>{formatDate(delivery.deliveryDate)}</Text>
            </View>
          )}
          {delivery.courierName && (
            <View style={styles.row}>
              <Text style={styles.label}>Courier:</Text>
              <Text style={styles.value}>{delivery.courierName}</Text>
            </View>
          )}
          {delivery.trackingNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Tracking Number:</Text>
              <Text style={styles.value}>{delivery.trackingNumber}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{delivery.deliveryStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressBlock}>
            <Text>{delivery.deliveryAddress}</Text>
          </View>
        </View>

        {/* Packing Lists */}
        {delivery.packingLists?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Packing Lists Included</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Packing List #</Text>
                <Text style={styles.tableCell}>Date</Text>
                <Text style={styles.tableCell}>Cartons</Text>
                <Text style={styles.tableCell}>Net Weight</Text>
                <Text style={styles.tableCell}>Items</Text>
              </View>
              {delivery.packingLists.map((packing: any) => (
                <View key={packing.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{packing.packingListNumber}</Text>
                  <Text style={styles.tableCell}>{formatDate(packing.packingDate)}</Text>
                  <Text style={styles.tableCell}>{packing.numberOfCartons}</Text>
                  <Text style={styles.tableCell}>{formatWeight(packing.totalNetWeight)}</Text>
                  <Text style={styles.tableCell}>{packing.items?.length || 0}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delivery Notes */}
        {delivery.deliveryNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Notes</Text>
            <Text>{delivery.deliveryNotes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <View style={{ marginTop: 20 }}>
            <View style={styles.row}>
              <View style={{ width: '50%' }}>
                <Text style={{ marginBottom: 30 }}>Delivered By:</Text>
                <Text>_________________________</Text>
                <Text style={{ fontSize: 8, marginTop: 5 }}>Signature & Date</Text>
              </View>
              <View style={{ width: '50%' }}>
                <Text style={{ marginBottom: 30 }}>Received By:</Text>
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
