import React, { useState, useEffect, useRef } from 'react';
import { Environment } from '../models/Environment';
import './EnvironmentModal.css';

interface EnvironmentModalProps {
  environment: Environment;
  onClose: () => void;
  onSave: (environment: Environment) => void;
  isOpen?: boolean;
}

const EnvironmentModal: React.FC<EnvironmentModalProps> = ({ environment, onClose, onSave }) => {
  const [name, setName] = useState(environment.name);
  const [description, setDescription] = useState(environment.description || '');
  const [variables, setVariables] = useState<
    Array<{ key: string; value: string; description: string }>
  >([]);
  const [edited, setEdited] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Inizializza variabili dallo stato environment
  useEffect(() => {
    const vars = Object.values(environment.getAllVariables()).map(v => ({
      key: v.key,
      value: v.value,
      description: v.description || '',
    }));
    setVariables(vars);
  }, [environment]);

  // Gestione click fuori dal modale per chiuderlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSave = () => {
    // Crea una copia dell'environment
    const updatedEnv = new Environment(environment.id, name.trim(), description.trim());

    // Aggiungi tutte le variabili
    variables.forEach(v => {
      if (v.key.trim()) {
        updatedEnv.setVariable(v.key.trim(), v.value, v.description);
      }
    });

    onSave(updatedEnv);
  };

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '', description: '' }]);
    setEdited(true);
  };

  const updateVariable = (index: number, field: 'key' | 'value' | 'description', value: string) => {
    const newVariables = [...variables];
    newVariables[index][field] = value;
    setVariables(newVariables);
    setEdited(true);
  };

  const removeVariable = (index: number) => {
    const newVariables = [...variables];
    newVariables.splice(index, 1);
    setVariables(newVariables);
    setEdited(true);
  };

  return (
    <div className="modal-overlay">
      <div className="environment-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Edit Environment: {environment.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setEdited(true);
              }}
              placeholder="Environment name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                setEdited(true);
              }}
              placeholder="Environment description (optional)"
            />
          </div>

          <div className="variables-section">
            <h3>Variables</h3>
            <table className="variables-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {variables.map((variable, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        value={variable.key}
                        onChange={e => updateVariable(index, 'key', e.target.value)}
                        placeholder="Variable name"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={variable.value}
                        onChange={e => updateVariable(index, 'value', e.target.value)}
                        placeholder="Value"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={variable.description}
                        onChange={e => updateVariable(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                      />
                    </td>
                    <td>
                      <button
                        className="remove-button"
                        onClick={() => removeVariable(index)}
                        title="Remove variable"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {variables.length === 0 && (
                  <tr>
                    <td colSpan={4} className="no-variables">
                      No variables
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button className="add-variable-button" onClick={addVariable}>
              + Add Variable
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave} disabled={!name.trim() || !edited}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentModal;
