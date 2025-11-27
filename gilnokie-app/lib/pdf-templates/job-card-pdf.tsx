import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles
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
  badge: {
    backgroundColor: '#000',
    color: '#fff',
    padding: 3,
    borderRadius: 3,
    fontSize: 8,
  },
});

type JobCardPDFProps = {
  jobCard: any;
};

export const JobCardPDF = ({ jobCard }: JobCardPDFProps) => {
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

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Job Card: {jobCard.jobCardNumber}</Text>
          <Text style={styles.subtitle}>
            Gilnokie Textile Management System | Generated: {formatDate(new Date())}
          </Text>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{jobCard.customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Stock Reference:</Text>
            <Text style={styles.value}>{jobCard.stockReference}</Text>
          </View>
          {jobCard.orderNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Order Number:</Text>
              <Text style={styles.value}>{jobCard.orderNumber}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Order Date:</Text>
            <Text style={styles.value}>{formatDate(jobCard.orderDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{jobCard.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Fabric Specification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fabric Specification</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fabric Quality:</Text>
            <Text style={styles.value}>{jobCard.fabricQuality.qualityCode}</Text>
          </View>
          {jobCard.fabricQuality.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{jobCard.fabricQuality.description}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Quantity Required:</Text>
            <Text style={styles.value}>
              {formatWeight(jobCard.quantityRequired)} ({jobCard.rollCount || 'N/A'} rolls)
            </Text>
          </View>
          {jobCard.targetWidth && (
            <View style={styles.row}>
              <Text style={styles.label}>Target Width:</Text>
              <Text style={styles.value}>{jobCard.targetWidth} cm</Text>
            </View>
          )}
          {jobCard.targetGSM && (
            <View style={styles.row}>
              <Text style={styles.label}>Target GSM:</Text>
              <Text style={styles.value}>{jobCard.targetGSM}</Text>
            </View>
          )}
        </View>

        {/* Fabric Composition */}
        {jobCard.fabricQuality.fabricContent?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fabric Composition</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Yarn Type</Text>
                <Text style={styles.tableCell}>Description</Text>
                <Text style={styles.tableCell}>Percentage</Text>
              </View>
              {jobCard.fabricQuality.fabricContent.map((content: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{content.yarnType.code}</Text>
                  <Text style={styles.tableCell}>{content.yarnType.description || '-'}</Text>
                  <Text style={styles.tableCell}>{content.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Production Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production Details</Text>
          {jobCard.machineAssigned && (
            <View style={styles.row}>
              <Text style={styles.label}>Machine Assigned:</Text>
              <Text style={styles.value}>{jobCard.machineAssigned}</Text>
            </View>
          )}
          {jobCard.targetEfficiency && (
            <View style={styles.row}>
              <Text style={styles.label}>Target Efficiency:</Text>
              <Text style={styles.value}>{jobCard.targetEfficiency}%</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Yarn Allocation:</Text>
            <Text style={styles.value}>{jobCard.yarnAllocationStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* Production Progress */}
        {jobCard.production?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production Records</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Piece #</Text>
                <Text style={styles.tableCell}>Weight</Text>
                <Text style={styles.tableCell}>Grade</Text>
                <Text style={styles.tableCell}>Date</Text>
              </View>
              {jobCard.production.slice(0, 10).map((prod: any) => (
                <View key={prod.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{prod.pieceNumber}</Text>
                  <Text style={styles.tableCell}>{formatWeight(prod.weight)}</Text>
                  <Text style={styles.tableCell}>{prod.qualityGrade || 'N/A'}</Text>
                  <Text style={styles.tableCell}>{formatDate(prod.productionDate)}</Text>
                </View>
              ))}
            </View>
            {jobCard.production.length > 10 && (
              <Text style={{ marginTop: 5, fontSize: 8, color: '#666' }}>
                ... and {jobCard.production.length - 10} more pieces
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        {jobCard.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{jobCard.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Gilnokie Textile Management System | This is a computer-generated document
        </Text>
      </Page>
    </Document>
  );
};
