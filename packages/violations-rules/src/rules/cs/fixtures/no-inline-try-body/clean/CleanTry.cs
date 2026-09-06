public class CleanClass
{
    public void Foo()
    {
        try {
            Worker.Join(1000);
        } catch {
        }
    }
}
