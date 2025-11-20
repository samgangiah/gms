"""
Data transformation functions for converting Access data to PostgreSQL format
"""
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional, Dict
import uuid


def generate_cuid() -> str:
    """Generate a CUID-like ID (simplified version)"""
    # Prisma uses cuid() which is more complex, but for migration we can use a simpler approach
    # In production, you might want to use the actual cuid library
    return str(uuid.uuid4())


def transform_id(value: Any, id_map: Optional[Dict[str, str]] = None) -> str:
    """
    Transform ID from Access format to CUID
    
    Args:
        value: Original ID value from Access
        id_map: Optional mapping of old IDs to new CUIDs
    
    Returns:
        New CUID string
    """
    if id_map and str(value) in id_map:
        return id_map[str(value)]
    
    new_id = generate_cuid()
    if id_map is not None:
        id_map[str(value)] = new_id
    return new_id


def transform_date(value: Any) -> Optional[datetime]:
    """
    Transform date from Access format to Python datetime
    
    Args:
        value: Date value from Access (could be datetime, string, or None)
    
    Returns:
        datetime object or None
    """
    if value is None:
        return None
    
    if isinstance(value, datetime):
        return value
    
    if isinstance(value, str):
        # Try parsing common date formats
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            pass
        
        # Try other common formats
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
            '%m/%d/%Y %H:%M:%S',
            '%m/%d/%Y',
            '%d/%m/%Y %H:%M:%S',
            '%d/%m/%Y',
        ]
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    
    # If it's a number (Access date serial number), convert it
    if isinstance(value, (int, float)):
        try:
            # Access stores dates as days since 1899-12-30
            from datetime import timedelta
            base_date = datetime(1899, 12, 30)
            return base_date + timedelta(days=float(value))
        except Exception:
            pass
    
    return None


def transform_decimal(value: Any) -> Optional[Decimal]:
    """
    Transform numeric value to Decimal
    
    Args:
        value: Numeric value from Access
    
    Returns:
        Decimal object or None
    """
    if value is None:
        return None
    
    if isinstance(value, Decimal):
        return value
    
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    
    if isinstance(value, str):
        # Remove currency symbols and whitespace
        cleaned = value.replace('$', '').replace(',', '').strip()
        if cleaned:
            try:
                return Decimal(cleaned)
            except Exception:
                return None
    
    return None


def transform_text(value: Any, max_length: Optional[int] = None) -> Optional[str]:
    """
    Transform text value, handling encoding and length
    
    Args:
        value: Text value from Access
        max_length: Optional maximum length (truncate if needed)
    
    Returns:
        String or None
    """
    if value is None:
        return None
    
    if isinstance(value, str):
        # Trim whitespace
        text = value.strip()
        
        # Handle encoding issues
        if isinstance(text, bytes):
            try:
                text = text.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text = text.decode('latin-1')
                except UnicodeDecodeError:
                    text = text.decode('utf-8', errors='replace')
        
        # Truncate if needed
        if max_length and len(text) > max_length:
            text = text[:max_length]
        
        return text if text else None
    
    # Convert other types to string
    return str(value).strip() if value else None


def transform_boolean(value: Any) -> bool:
    """
    Transform boolean value from Access format
    
    Access uses -1/0 or Yes/No for booleans
    
    Args:
        value: Boolean value from Access
    
    Returns:
        bool
    """
    if value is None:
        return False
    
    if isinstance(value, bool):
        return value
    
    if isinstance(value, (int, float)):
        return value != 0
    
    if isinstance(value, str):
        value_lower = value.lower().strip()
        if value_lower in ('yes', 'true', '1', '-1', 'y'):
            return True
        if value_lower in ('no', 'false', '0', 'n'):
            return False
    
    return bool(value)


def transform_integer(value: Any) -> Optional[int]:
    """
    Transform integer value
    
    Args:
        value: Integer value from Access
    
    Returns:
        int or None
    """
    if value is None:
        return None
    
    if isinstance(value, int):
        return value
    
    if isinstance(value, float):
        return int(value)
    
    if isinstance(value, str):
        try:
            return int(float(value))
        except ValueError:
            return None
    
    return None


def lookup_foreign_key(
    value: Any,
    lookup_map: Optional[Dict[str, str]] = None,
    allow_null: bool = True
) -> Optional[str]:
    """
    Lookup foreign key CUID from original value
    
    Args:
        value: Original foreign key value (e.g., customer name)
        lookup_map: Mapping of original values to CUIDs (optional, can be None)
        allow_null: Whether None is allowed
    
    Returns:
        CUID string or None
    """
    if value is None:
        return None if allow_null else ""
    
    if lookup_map is None:
        return None if allow_null else ""
    
    key = str(value).strip()
    # Try exact match first
    if key in lookup_map:
        return lookup_map[key]
    
    # Try uppercase match for case-insensitive lookups (used for description-based maps)
    key_upper = key.upper()
    if key_upper in lookup_map:
        return lookup_map[key_upper]
    
    # If not found and null not allowed, return empty string (will cause FK error)
    if not allow_null:
        return ""
    
    return None


def transform_json(value: Any) -> Optional[Dict]:
    """
    Transform value to JSON-compatible dict
    
    Args:
        value: Value that should be stored as JSON
    
    Returns:
        Dict or None
    """
    if value is None:
        return None
    
    if isinstance(value, dict):
        return value
    
    if isinstance(value, str):
        try:
            import json
            return json.loads(value)
        except Exception:
            return {'raw': value}
    
    return {'value': str(value)}


def apply_transformations(
    record: Dict[str, Any],
    field_mapping: Dict[str, str],
    transformations: Dict[str, callable],
    id_map: Optional[Dict[str, str]] = None,
    lookup_maps: Optional[Dict[str, Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Apply all transformations to a record
    
    Args:
        record: Source record from Access
        field_mapping: Mapping of source fields to destination fields
        transformations: Mapping of destination fields to transformation functions
        id_map: Optional ID mapping dictionary
        lookup_maps: Optional foreign key lookup maps
    
    Returns:
        Transformed record ready for insertion
    """
    transformed = {}
    
    for source_field, dest_field in field_mapping.items():
        source_value = record.get(source_field)
        
        # Get transformation function
        transform_func = transformations.get(dest_field)
        
        if transform_func:
            try:
                # Handle special transformations that need extra params
                if transform_func == lookup_foreign_key:
                    # Determine which lookup map to use
                    lookup_map = None
                    if lookup_maps:
                        # Special case: User_Name -> user_id should use name-based lookup
                        if source_field == 'User_Name' and 'users_by_name' in lookup_maps:
                            lookup_map = lookup_maps['users_by_name']
                        # Special case: TypeYC -> yarn_type_id should use description-based lookup
                        elif source_field == 'TypeYC' and 'yarn_types_by_description' in lookup_maps:
                            lookup_map = lookup_maps['yarn_types_by_description']
                        else:
                            # Try to find matching lookup map based on field name
                            # Pattern: customer_id -> customers, yarn_type_id -> yarn_types, etc.
                            field_base = dest_field.replace('_id', '')
                            
                            # Try exact table name match first
                            if field_base in lookup_maps:
                                lookup_map = lookup_maps[field_base]
                            else:
                                # Try pluralized version
                                plural_key = f"{field_base}s"
                                if plural_key in lookup_maps:
                                    lookup_map = lookup_maps[plural_key]
                                else:
                                    # Try to find by partial match
                                    for map_name, map_data in lookup_maps.items():
                                        if field_base in map_name or map_name.replace('_', '') in field_base.replace('_', ''):
                                            lookup_map = map_data
                                            break
                    
                    # Determine if null is allowed based on field name patterns
                    allow_null = dest_field.endswith('_id') and 'customer' in dest_field.lower()  # customer_id is nullable in some tables
                    if 'delivery_note_id' in dest_field or 'pack_info_id' in dest_field:
                        allow_null = True
                    
                    transformed[dest_field] = transform_func(source_value, lookup_map, allow_null=allow_null)
                elif transform_func == transform_id:
                    transformed[dest_field] = transform_func(source_value, id_map)
                else:
                    transformed[dest_field] = transform_func(source_value)
            except Exception as e:
                # Log error but continue
                print(f"Warning: Error transforming {source_field} -> {dest_field}: {e}")
                transformed[dest_field] = None
        else:
            # No transformation, use value as-is (with basic cleaning)
            transformed[dest_field] = transform_text(source_value) if source_value is not None else None
    
    return transformed

