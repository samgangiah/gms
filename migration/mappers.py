"""
Field mapping definitions between Access tables and Prisma models
"""
from typing import Dict, Any, Callable
from transformers import (
    transform_id, transform_date, transform_decimal, transform_text,
    transform_boolean, transform_integer, lookup_foreign_key, transform_json
)


# Field mappings for each table
# Format: {access_table_name: {source_field: dest_field}}
FIELD_MAPPINGS: Dict[str, Dict[str, str]] = {
    'Customers': {
        'Customer': 'name',
        'Person': 'contact_person',
        'Tel_No': 'phone',
        'Fax_No': 'fax',
        'Cell_No': 'cellphone',
        # Note: Email, Address, Active not in source - will use defaults
    },
    'Yarn_Types': {
        'Yarn_Code': 'code',
        'Yarn_Type': 'description',  # Using Yarn_Type as description
        'Tex': 'tex_count',
        'Supplier': 'supplier_name',
        'Note': 'description',  # Combining Note with description (may need custom transformer)
        # Note: Material, Color, Supplier_Code, Price_Per_KG, Active not in source
    },
    'Fabric_Quality': {
        'Fab_Qual_No': 'quality_code',
        'Name': 'description',  # Using Name as primary description
        # Note: Description field exists but would conflict - may need custom transformer to combine
        'Geige_Width': 'greige_dimensions',  # Note: typo in source "Geige" vs "Greige"
        'Geige_Weight': 'greige_density',
        'Finish_Width': 'finished_dimensions',
        'Finish_Weight': 'finished_density',
        'Gauge': 'machine_gauge',
        'Mach_No': 'machine_type',
        'Spec_No': 'spec_sheet_ref',
        'Slitting_Line': 'slitting_required',
        # Note: Width, Weight, Active not in source - may need to derive from dimensions
    },
    'Users': {
        'User_Code': 'email',  # Using User_Code as email (may need transformation)
        'User_Name': 'name',
        'Manager_Flag': 'role',  # Convert manager flag to role
        # Note: Active not in source - will default to true
    },
    'Fabric_Content': {
        'Fab_Quality': 'quality_id',  # FK lookup - using Fab_Quality
        'TypeYC': 'yarn_type_id',  # FK lookup - using TypeYC (may need to map to Yarn_Code)
        'Percent': 'percentage',  # Using Percent
        'UNQ_ID': 'position',  # Using UNQ_ID as position (may need verification)
        # Note: Tex field exists in source but not in destination schema
    },
    'Stock_Ref': {
        'Stock_Ref': 'id',  # Will be transformed to CUID
        'Yarn_Code': 'yarn_type_id',  # FK lookup
        'Customer': 'customer_id',  # FK lookup (nullable)
        'Stock': 'quantity_in_stock',  # Using Stock as quantity
        'Status': 'status',
        'Date_Stamp': 'date_added',  # Using Date_Stamp as date_added
        'Yarn_Type': 'notes',  # Using Yarn_Type description as notes
        'Tex': 'notes',  # May need custom handling
        # Note: Last_Modified not in source - will use date_added or now()
    },
    'Customer_Orders': {
        'Job_Card_No': 'job_card_number',
        'Stock_Ref': 'stock_reference',
        'Customer_Name': 'customer_id',  # FK lookup - using Customer_Name
        'Order_No': 'order_number',
        'Date_Ord_Rcv': 'order_date',  # Using Date_Ord_Rcv as order_date
        'Quality_No': 'quality_id',  # FK lookup
        'Qty_Req': 'quantity_required',
        'Actl_Mach': 'machine_assigned',  # Using Actl_Mach
        'Finish_Refer': 'notes',  # Using Finish_Refer as notes
        # Note: Delivery_Date exists but not mapped (would conflict with order_date)
        # Note: Status not in source - will default to "active"
    },
    'Yarn_Stock': {
        'Job_No': 'job_card_id',  # FK lookup - using Job_No
        'Stock': 'stock_ref_id',  # FK lookup - need to map Stock value to stock_ref_id
        'Rec': 'quantity_received',  # Using Rec as quantity_received
        'Loss': 'quantity_loss',  # Using Loss as quantity_loss
        'Kgs': 'quantity_used',  # Using Kgs as quantity_used (may need verification)
        'Stock_Date': 'date_received',  # Using Stock_Date as date_received
        'Quality_No': 'notes',  # Using Quality_No as notes field
        # Note: Delivery_No exists in source but delivery_note_id not in yarn_stock schema
        # Note: Qty_Used calculation may need custom logic
    },
    'Production_Information': {
        'Piece_No': 'piece_number',
        'Job_Card_No': 'job_card_id',  # FK lookup
        'Weight': 'weight',
        'SlipDate': 'production_date',  # Using SlipDate as production_date
        'SlipTime': 'production_time',  # Using SlipTime as production_time
        'Delivery_Note_No': 'delivery_note_id',  # FK lookup (nullable)
        'Pack_Slip_No': 'pack_info_id',  # FK lookup (nullable)
        'Delivery_Desc': 'notes',  # Using Delivery_Desc as notes
        # Note: UNQ exists but we generate new CUID for id
        # Note: Machine_No, Operator, Quality_Grade, Archived not in source - will use defaults
    },
    'Delivery_Note': {
        'Delivery_No': 'delivery_number',
        # Note: Only Delivery_No exists in source - other fields not available
        # Customer, Delivery_Date, Total_Weight, Driver, Vehicle_Reg, Notes will need defaults or derive from related tables
    },
    'Pack_Info': {
        'PackNo': 'pack_slip_number',  # Using PackNo
        'Delivery_No': 'delivery_note_id',  # FK lookup (nullable)
        'Total': 'total_weight',  # Using Total as total_weight
        'SlipDate': 'pack_date',  # Using SlipDate as pack_date
        # Note: JobNo exists in source but job_card_id not in pack_info schema
        # Note: Piece_Count, Notes not in source - may need to calculate piece_count from Production_Information
    },
    'UserLogs': {
        'User_Name': 'user_id',  # FK lookup - need to map User_Name to user ID
        'Login_Time': 'timestamp',  # Using Login_Time as timestamp
        # Note: ID exists but we generate new CUID
        # Note: Logout_Time exists but not mapped (would conflict with timestamp)
        # Note: Action, IP_Address, Metadata not in source - will use defaults
        # Action will default to "login" based on Login_Time presence
    },
}


# Transformation functions for each destination field
# Format: {dest_table: {dest_field: transform_function}}
TRANSFORMATIONS: Dict[str, Dict[str, Callable]] = {
    'customers': {
        'id': transform_id,
        'name': transform_text,
        'contact_person': transform_text,
        'phone': transform_text,
        'fax': transform_text,
        'cellphone': transform_text,
        'email': transform_text,
        'address': transform_text,
        'active': transform_boolean,
    },
    'yarn_types': {
        'id': transform_id,
        'code': transform_text,
        'description': transform_text,
        'material': transform_text,
        'tex_count': transform_text,
        'color': transform_text,
        'supplier_name': transform_text,
        'supplier_code': transform_text,
        'unit_price': transform_decimal,
        'active': transform_boolean,
    },
    'fabric_quality': {
        'id': transform_id,
        'quality_code': transform_text,
        'description': transform_text,
        'greige_dimensions': transform_text,
        'finished_dimensions': transform_text,
        'greige_density': transform_text,
        'finished_density': transform_text,
        'width': transform_decimal,
        'weight': transform_decimal,
        'machine_gauge': transform_text,
        'machine_type': transform_text,
        'spec_sheet_ref': transform_text,
        'slitting_required': transform_boolean,
        'active': transform_boolean,
    },
    'users': {
        'id': transform_id,
        'email': transform_text,
        'name': transform_text,
        'role': lambda x: 'manager' if transform_boolean(x) else 'standard',
        'active': transform_boolean,
    },
    'fabric_content': {
        'id': transform_id,
        'quality_id': lookup_foreign_key,
        'yarn_type_id': lookup_foreign_key,
        'percentage': transform_decimal,
        'position': transform_integer,
    },
    'stock_ref': {
        'id': transform_id,
        'yarn_type_id': lookup_foreign_key,
        'customer_id': lookup_foreign_key,
        'quantity_in_stock': transform_decimal,
        'status': transform_text,
        'date_added': transform_date,
        'last_modified': transform_date,
        'notes': transform_text,
    },
    'customer_orders': {
        'id': transform_id,
        'job_card_number': transform_text,
        'stock_reference': transform_text,
        'customer_id': lookup_foreign_key,
        'order_number': transform_text,
        'order_date': transform_date,
        'quality_id': lookup_foreign_key,
        'quantity_required': transform_decimal,
        'machine_assigned': transform_text,
        'notes': transform_text,
        'status': transform_text,
    },
    'yarn_stock': {
        'id': transform_id,
        'job_card_id': lookup_foreign_key,
        'stock_ref_id': lookup_foreign_key,
        'quantity_received': transform_decimal,
        'quantity_used': transform_decimal,
        'quantity_loss': transform_decimal,
        'date_received': transform_date,
        'notes': transform_text,
    },
    'production_information': {
        'id': transform_id,
        'piece_number': transform_text,
        'job_card_id': lookup_foreign_key,
        'weight': transform_decimal,
        'production_date': transform_date,
        'production_time': transform_date,
        'delivery_note_id': lookup_foreign_key,
        'pack_info_id': lookup_foreign_key,
        'machine_number': transform_text,
        'operator_name': transform_text,
        'quality_grade': transform_text,
        'notes': transform_text,
        'archived': transform_boolean,
    },
    'delivery_note': {
        'id': transform_id,
        'delivery_number': transform_text,
        'customer_id': lookup_foreign_key,
        'delivery_date': transform_date,
        'total_weight': transform_decimal,
        'driver_name': transform_text,
        'vehicle_reg': transform_text,
        'notes': transform_text,
    },
    'pack_info': {
        'id': transform_id,
        'pack_slip_number': transform_text,
        'delivery_note_id': lookup_foreign_key,
        'total_weight': transform_decimal,
        'piece_count': transform_integer,
        'pack_date': transform_date,
        'notes': transform_text,
    },
    'user_logs': {
        'id': transform_id,
        'user_id': lookup_foreign_key,
        'action': transform_text,
        'timestamp': transform_date,
        'ip_address': transform_text,
        'metadata': transform_json,
    },
}


# Table name mappings: Access table name -> PostgreSQL table name
TABLE_MAPPINGS: Dict[str, str] = {
    'Customers': 'customers',
    'Yarn_Types': 'yarn_types',
    'Fabric_Quality': 'fabric_quality',
    'Users': 'users',
    'Fabric_Content': 'fabric_content',
    'Stock_Ref': 'stock_ref',
    'Customer_Orders': 'customer_orders',
    'Yarn_Stock': 'yarn_stock',
    'Production_Information': 'production_information',
    'Delivery_Note': 'delivery_note',
    'Pack_Info': 'pack_info',
    'UserLogs': 'user_logs',
}


def get_field_mapping(access_table: str) -> Dict[str, str]:
    """Get field mapping for an Access table"""
    return FIELD_MAPPINGS.get(access_table, {})


def get_transformations(dest_table: str) -> Dict[str, Callable]:
    """Get transformation functions for a destination table"""
    return TRANSFORMATIONS.get(dest_table, {})


def get_table_mapping(access_table: str) -> str:
    """Get PostgreSQL table name for an Access table"""
    return TABLE_MAPPINGS.get(access_table, access_table.lower())


def get_required_source_columns(access_table: str) -> list:
    """Get list of required source columns for a table"""
    mapping = get_field_mapping(access_table)
    return list(mapping.keys())


def get_required_dest_columns(dest_table: str) -> list:
    """Get list of required destination columns for a table"""
    # Based on Prisma schema, these are the required (non-nullable) fields
    required_fields = {
        'customers': ['name'],
        'yarn_types': ['code'],
        'fabric_quality': ['quality_code'],
        'users': ['email', 'name'],
        'fabric_content': ['quality_id', 'yarn_type_id', 'percentage', 'position'],
        'stock_ref': ['yarn_type_id', 'quantity_in_stock', 'status'],
        'customer_orders': ['job_card_number', 'stock_reference', 'customer_id', 'order_date', 'quality_id', 'quantity_required', 'status'],
        'yarn_stock': ['job_card_id', 'stock_ref_id', 'quantity_received', 'date_received'],
        'production_information': ['piece_number', 'job_card_id', 'weight', 'production_date'],
        'delivery_note': ['delivery_number', 'customer_id', 'delivery_date'],
        'pack_info': ['pack_slip_number', 'total_weight', 'piece_count', 'pack_date'],
        'user_logs': ['user_id', 'action', 'timestamp'],
    }
    return required_fields.get(dest_table, [])

