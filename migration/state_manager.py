"""
Migration state management for re-runnable migrations
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional


class StateManager:
    """Manages migration state for resume capability"""
    
    def __init__(self, state_file: str = "migration-state.json"):
        self.state_file = Path(state_file)
        self.state: Dict[str, Any] = {
            'version': '1.0',
            'started_at': None,
            'last_updated': None,
            'tables': {},
        }
        self.load()
    
    def load(self):
        """Load state from file"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    self.state = json.load(f)
            except Exception:
                # If file is corrupted, start fresh
                self.state = {
                    'version': '1.0',
                    'started_at': None,
                    'last_updated': None,
                    'tables': {},
                }
    
    def save(self):
        """Save state to file"""
        self.state['last_updated'] = datetime.now().isoformat()
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)
    
    def start_migration(self):
        """Mark migration as started"""
        if not self.state['started_at']:
            self.state['started_at'] = datetime.now().isoformat()
        self.save()
    
    def get_table_state(self, table_name: str) -> Dict[str, Any]:
        """Get state for a specific table"""
        return self.state['tables'].get(table_name, {
            'status': 'pending',
            'records_migrated': 0,
            'last_id': None,
            'started_at': None,
            'completed_at': None,
        })
    
    def update_table_state(self, table_name: str, **kwargs):
        """Update state for a specific table"""
        if table_name not in self.state['tables']:
            self.state['tables'][table_name] = {
                'status': 'in_progress',
                'records_migrated': 0,
                'last_id': None,
                'started_at': datetime.now().isoformat(),
                'completed_at': None,
            }
        
        self.state['tables'][table_name].update(kwargs)
        self.state['tables'][table_name]['last_updated'] = datetime.now().isoformat()
        self.save()
    
    def mark_table_complete(self, table_name: str, records_migrated: int, checksum: Optional[str] = None):
        """Mark a table as completed"""
        self.update_table_state(
            table_name,
            status='completed',
            records_migrated=records_migrated,
            completed_at=datetime.now().isoformat(),
            checksum=checksum,
        )
    
    def mark_table_failed(self, table_name: str, error: str):
        """Mark a table as failed"""
        self.update_table_state(
            table_name,
            status='failed',
            error=error,
        )
    
    def is_table_complete(self, table_name: str) -> bool:
        """Check if a table migration is complete"""
        state = self.get_table_state(table_name)
        return state.get('status') == 'completed'
    
    def should_skip_table(self, table_name: str, force: bool = False) -> bool:
        """Check if table should be skipped"""
        if force:
            return False
        return self.is_table_complete(table_name)
    
    def reset_table(self, table_name: str):
        """Reset state for a table"""
        if table_name in self.state['tables']:
            del self.state['tables'][table_name]
        self.save()
    
    def reset_all(self):
        """Reset all migration state"""
        self.state = {
            'version': '1.0',
            'started_at': None,
            'last_updated': None,
            'tables': {},
        }
        self.save()
    
    def get_summary(self) -> Dict[str, Any]:
        """Get migration summary"""
        total_tables = len(self.state['tables'])
        completed = sum(1 for t in self.state['tables'].values() if t.get('status') == 'completed')
        failed = sum(1 for t in self.state['tables'].values() if t.get('status') == 'failed')
        in_progress = sum(1 for t in self.state['tables'].values() if t.get('status') == 'in_progress')
        total_records = sum(t.get('records_migrated', 0) for t in self.state['tables'].values())
        
        return {
            'started_at': self.state.get('started_at'),
            'last_updated': self.state.get('last_updated'),
            'total_tables': total_tables,
            'completed': completed,
            'failed': failed,
            'in_progress': in_progress,
            'total_records_migrated': total_records,
        }

