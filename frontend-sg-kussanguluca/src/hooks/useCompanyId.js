import { useEffect, useState } from 'react';
import { empresaService } from '../services/empresaService';

export function useCompanyId() {
  const [companyId, setCompanyId] = useState(null);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        setLoadingCompany(true);

        const stored = localStorage.getItem('activeCompanyId');
        if (!stored) {
          if (isMounted) {
            setCompanyId(null);
            setActiveCompany(null);
          }
          return;
        }

        const empresas = await empresaService.getByUser();
        const empresa = empresas?.find(e => String(e.id_empresa) === String(stored));
        if (!empresa) {
          localStorage.removeItem('activeCompanyId');
          if (isMounted) {
            setCompanyId(null);
            setActiveCompany(null);
          }
          return;
        }

        // ✅ AMBOS dentro do isMounted
        if (isMounted) {
          setCompanyId(Number(stored));
          setActiveCompany(empresa);
        }
      } catch (e) {
        console.error(e);
        localStorage.removeItem('activeCompanyId');
        if (isMounted) {
          setCompanyId(null);
          setActiveCompany(null);
        }
      } finally {
        if (isMounted) setLoadingCompany(false);
      }
    }

    hydrate();
    return () => { isMounted = false; };
  }, []);

  // ✅ selectCompany recebe o objeto completo da empresa
  const selectCompany = (empresa) => {
    if (!empresa) {
      localStorage.removeItem('activeCompanyId');
      setCompanyId(null);
      setActiveCompany(null);
      return;
    }
    localStorage.setItem('activeCompanyId', String(empresa.id_empresa));
    setCompanyId(Number(empresa.id_empresa));
    setActiveCompany(empresa);
  };

  return { companyId, activeCompany, loadingCompany, selectCompany };
}