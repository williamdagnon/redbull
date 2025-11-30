import React, { useEffect } from 'react';

// DepositForm removed: the app uses `RechargePage` instead. This stub redirects.
const DepositForm: React.FC<any> = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') window.location.replace('/recharge');
  }, []);
  return null;
};

export default DepositForm;
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmer le Dépôt
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Footer */}
      {step === 'success' && (
        <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={onSuccess}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105"
            >
              Retourner au Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositForm;
