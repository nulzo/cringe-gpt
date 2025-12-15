using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface ICannedQuestionRepository : IGenericRepository<CannedQuestion>
{
    Task<IEnumerable<CannedQuestion>> GetAllOrderedAsync();
    Task<CannedQuestion?> GetByIdAsync(int id);
    Task<IEnumerable<CannedQuestion>> GetByOrderRangeAsync(int minOrder, int maxOrder);
    Task<int> GetMaxOrderAsync();
    Task UpdateOrdersAsync(IEnumerable<CannedQuestion> questions);
}
